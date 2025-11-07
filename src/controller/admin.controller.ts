// handlers/userHandler.ts
import { Request, Response, NextFunction } from "express";
import { connectToDatabase } from "../config/database";
import { ObjectId } from "mongodb";
import { push } from "../services/sendPushNotification";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = await connectToDatabase();
    const users = await db.collection("users").find({}).toArray();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const blockUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, message: "userId is required" });
    return;
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (user.isBlocked === true) {
      res
        .status(400)
        .json({ success: false, message: "User is already blocked" });
      return;
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBlocked: true } }
    );

    if (user.device_token) {
      try {
        await push(
          user.device_token,
          "Account Blocked",
          "You are blocked by Admin"
        );
      } catch (pushError) {
        console.error("Error sending block notification:", pushError);
      }
    } else {
      console.warn("No device token found for user:", userId);
    }

    res
      .status(200)
      .json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const unblockUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, message: "userId is required" });
    return;
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (!user.isBlocked || user.isBlocked === false) {
      res
        .status(400)
        .json({ success: false, message: "User is already unblocked" });
      return;
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBlocked: false } }
    );

    if (user.device_token) {
      try {
        await push(
          user.device_token,
          "Account Unblocked",
          "You are unblocked by Admin"
        );
      } catch (pushError) {
        console.error("Error sending unblock notification:", pushError);
      }
    } else {
      console.warn("No device token found for user:", userId);
    }

    res
      .status(200)
      .json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getBlockedUsers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const blockedUsers = await usersCollection
      .find({ isBlocked: true })
      .toArray();

    res.status(200).json({ success: true, data: blockedUsers });
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



import { getCollection } from '../config/database';

export const saveUserPlanHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      plan_detail,
      expiry_date,
      buy_date,
      validity,
      token,
      transaction_id,
      user_id,
    } = req.body;

    if (!user_id) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const aiPlansCollection = await getCollection("ai_plans");
    const usersCollection = await getCollection("users");
    const userObjectId = new ObjectId(user_id);

    // Get the existing plan for the user
    const existingPlan = await aiPlansCollection.findOne({ user_id: userObjectId });

    let newCallLimit = plan_detail?.call_limit || 0;

    if (existingPlan && existingPlan.plan_detail?.call_limit !== undefined) {
      const previousCallLimit = existingPlan.plan_detail.call_limit;

      // ✅ Always add the new call_limit to existing one (whether positive or negative)
      newCallLimit += previousCallLimit;
    }

    // Update the plan_detail's call_limit before saving
    plan_detail.call_limit = newCallLimit;


    const planData = {
      user_id: userObjectId,
      plan_detail,
      expiry_date: new Date(expiry_date),
      buy_date: new Date(buy_date),
      validity,
      token,
      transaction_id,
      created_at: new Date(),
    };

    // Replace or insert the user's plan (upsert)
    const result = await aiPlansCollection.updateOne(
      { user_id: userObjectId },
      { $set: planData },
      { upsert: true }
    );

    // Reset call count to 0
    await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: { call_count: 0 } }
    );

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      upserted: result.upsertedId || null,
    });
  } catch (error) {
    console.error("Error saving user plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// import { getCollection } from "../config/database";
// export const saveUserPlanHandler = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const {
//       plan_detail,
//       expiry_date,
//       buy_date,
//       validity,
//       token,
//       transaction_id,
//       user_id,
//     } = req.body;

//     // Validate required fields
//     if (!user_id) {
//       res.status(400).json({ error: "Missing required fields" });
//       return;
//     }

//     const aiPlansCollection = await getCollection("ai_plans");

//     const userObjectId = new ObjectId(user_id);

//     // Delete previous plan(s) for the user
//     await aiPlansCollection.deleteMany({ user_id: userObjectId });

//     // Prepare new plan data
//     const planData = {
//       user_id: userObjectId,
//       plan_detail,
//       expiry_date: new Date(expiry_date),
//       buy_date: new Date(buy_date),
//       validity,
//       token,
//       transaction_id,
//       created_at: new Date(),
//     };

//     // Insert the new plan
//     const result = await aiPlansCollection.insertOne(planData);
//     const usersCollection = await getCollection("users");

//     // Reset call_count to 0 for the user
//     await usersCollection.updateOne(
//       { _id: userObjectId },
//       { $set: { call_count: 0 } }
//     );

//     res.status(201).json({
//       success: true,
//       message: "Plan saved successfully",
//       plan_id: result.insertedId,
//     });
//   } catch (error) {
//     console.error("Error saving user plan:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// import { Request, Response } from "express";
// import { ObjectId } from "mongodb";
// import { getCollection } from "../config/database";

// export const getLatestUserPlanHandler = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { user_id } = req.query;

//     if (!user_id || !ObjectId.isValid(user_id as string)) {
//       res.status(400).json({ error: "Valid user_id is required" });
//       return;
//     }

//     const userObjectId = new ObjectId(user_id as string);
//     const aiPlansCollection = await getCollection("ai_plans");

//     const latestPlan = await aiPlansCollection
//       .find({ user_id: userObjectId })
//       .sort({ created_at: -1 })
//       .limit(1)
//       .toArray();

//     if (latestPlan.length === 0) {
//       res.status(404).json({ error: "No plans found for the user" });
//       return;
//     }

//     const plan = latestPlan[0];

//     // Remove sensitive fields
//     if ("plan_detail" in plan) {
//       delete plan.token;
//     }
//     if ("validity" in plan) {
//       delete plan.token;
//     }
//     if ("expiry_date" in plan) {
//       delete plan.token;
//     }

//     // Calculate days left to expire
//     const now = new Date();
//     const expiryDate = new Date(plan.expiry_date);
//     const timeDiff = expiryDate.getTime() - now.getTime();
//     const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

//     plan.days_left_to_expire = daysLeft;

//     res.status(200).json({
//       success: true,
//       data: plan,
//     });
//   } catch (error) {
//     console.error("Error fetching latest user plan:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };



// export const getLatestUserPlanHandler = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { user_id } = req.query;

//     if (!user_id || !ObjectId.isValid(user_id as string)) {
//       res.status(400).json({ error: "Valid user_id is required" });
//       return;
//     }

//     const userObjectId = new ObjectId(user_id as string);
//     const aiPlansCollection = await getCollection("ai_plans");

//     const latestPlan = await aiPlansCollection
//       .find({ user_id: userObjectId })
//       .sort({ created_at: -1 })
//       .limit(1)
//       .toArray();

//     if (latestPlan.length === 0) {
//       res.status(404).json({ error: "No plans found for the user" });
//       return;
//     }

//     const plan = latestPlan[0];

//     // Calculate days left to expire
//     const now = new Date();
//     const expiryDate = new Date(plan.expiry_date);
//     const timeDiff = expiryDate.getTime() - now.getTime();
//     const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

//     // Normalize plan_detail and benefits
//     let normalizedPlanDetail: string | undefined = undefined;
//     let benefits: any[] = [];

//     if (typeof plan.plan_detail === "string") {
//       normalizedPlanDetail = plan.plan_detail;
//     } else if (typeof plan.plan_detail === "object") {
//       if (plan.plan_detail.plan) {
//         normalizedPlanDetail = plan.plan_detail.plan;
//       }
//       if (Array.isArray(plan.plan_detail.benefits)) {
//         benefits = plan.plan_detail.benefits;
//       }
//     }

//     // Only pick allowed fields
//     const filteredResponse = {
//       _id: plan._id,
//       active_plan: normalizedPlanDetail,
//       benefits: benefits,
//       transaction_id: plan.transaction_id,
//       user_id: plan.user_id,
//       expiry_date: plan.expiry_date,
//       days_left_to_expire: daysLeft,
//     };

//     res.status(200).json({
//       success: true,
//       data: filteredResponse,
//     });
//   } catch (error) {
//     console.error("Error fetching latest user plan:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
export const getLatestUserPlanHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id } = req.query;

    if (!user_id || !ObjectId.isValid(user_id as string)) {
      res.status(400).json({ error: "Valid user_id is required" });
      return;
    }

    const userObjectId = new ObjectId(user_id as string);
    const aiPlansCollection = await getCollection("ai_plans");

    const latestPlan = await aiPlansCollection
      .find({ user_id: userObjectId })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();

    if (latestPlan.length === 0) {
      res.status(404).json({ error: "No plans found for the user" });
      return;
    }

    const plan = latestPlan[0];

    // Calculate days left to expire
    const now = new Date();
    const expiryDate = new Date(plan.expiry_date);
    const timeDiff = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    // Normalize plan_detail and benefits
    let normalizedPlanDetail: string | undefined = undefined;
    let benefits: any[] = [];

    if (typeof plan.plan_detail === "string") {
      normalizedPlanDetail = plan.plan_detail;
    } else if (typeof plan.plan_detail === "object") {
      if (plan.plan_detail.plan) {
        normalizedPlanDetail = plan.plan_detail.plan;
      }
      if (Array.isArray(plan.plan_detail.benefits)) {
        benefits = plan.plan_detail.benefits;
      }
    }

    // Build response object
    const filteredResponse: any = {
      _id: plan._id,
      active_plan: normalizedPlanDetail,
      benefits: benefits,
      transaction_id: plan.transaction_id,
      user_id: plan.user_id,
      buy_date: plan.buy_date,
      expiry_date: plan.expiry_date,
      days_left_to_expire: daysLeft,
    };

    // Include call_limit if it exists
    if ('call_limit' in plan && typeof plan.call_limit === 'number') {
      filteredResponse.call_limit = plan.call_limit;
    }

    res.status(200).json({
      success: true,
      data: filteredResponse,
    });
  } catch (error) {
    console.error("Error fetching latest user plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const getLatestUserPlanHandler = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { user_id } = req.query;

//     if (!user_id || !ObjectId.isValid(user_id as string)) {
//       res.status(400).json({ error: "Valid user_id is required" });
//       return;
//     }

//     const userObjectId = new ObjectId(user_id as string);
//     const aiPlansCollection = await getCollection("ai_plans");

//     const latestPlan = await aiPlansCollection
//       .find({ user_id: userObjectId })
//       .sort({ created_at: -1 })
//       .limit(1)
//       .toArray();

//     if (latestPlan.length === 0) {
//       res.status(404).json({ error: "No plans found for the user" });
//       return;
//     }

//     const plan = latestPlan[0];

//     // Calculate days left to expire
//     const now = new Date();
//     const expiryDate = new Date(plan.expiry_date);
//     const timeDiff = expiryDate.getTime() - now.getTime();
//     const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

//     // Normalize plan_detail and benefits
//     let normalizedPlanDetail: string | undefined = undefined;
//     let benefits: any[] = [];

//     if (typeof plan.plan_detail === "string") {
//       normalizedPlanDetail = plan.plan_detail;
//     } else if (typeof plan.plan_detail === "object") {
//       if (plan.plan_detail.plan) {
//         normalizedPlanDetail = plan.plan_detail.plan;
//       }
//       if (Array.isArray(plan.plan_detail.benefits)) {
//         benefits = plan.plan_detail.benefits;
//       }
//     }

//     // Only pick allowed fields
//     const filteredResponse = {
//       _id: plan._id,
//       active_plan: normalizedPlanDetail,
//       benefits: benefits,
//       transaction_id: plan.transaction_id,
//       user_id: plan.user_id,
//       buy_date: plan.buy_date,
//       expiry_date: plan.expiry_date,
//       days_left_to_expire: daysLeft,
//     };

//     res.status(200).json({
//       success: true,
//       data: filteredResponse,
//     });
//   } catch (error) {
//     console.error("Error fetching latest user plan:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };


// export const getLatestUserPlanHandler = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { user_id } = req.query;

//     if (!user_id || !ObjectId.isValid(user_id as string)) {
//       res.status(400).json({ error: "Valid user_id is required" });
//       return;
//     }

//     const userObjectId = new ObjectId(user_id as string);
//     const aiPlansCollection = await getCollection("ai_plans");

//     const latestPlan = await aiPlansCollection
//       .find({ user_id: userObjectId })
//       .sort({ created_at: -1 })
//       .limit(1)
//       .toArray();

//     if (latestPlan.length === 0) {
//       res.status(404).json({ error: "No plans found for the user" });
//       return;
//     }

//     const plan = latestPlan[0];

//     // Calculate days left to expire
//     const now = new Date();
//     const expiryDate = new Date(plan.expiry_date);
//     const timeDiff = expiryDate.getTime() - now.getTime();
//     const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

//     // Normalize plan_detail
//     let normalizedPlanDetail: string | undefined = undefined;
//     if (typeof plan.plan_detail === "string") {
//       normalizedPlanDetail = plan.plan_detail;
//     } else if (typeof plan.plan_detail === "object" && plan.plan_detail.plan) {
//       normalizedPlanDetail = plan.plan_detail.plan;
//     }

//     // Only pick allowed fields
//     const filteredResponse = {
//       // token: plan.token,
//       _id: plan._id,
//       active_plan: normalizedPlanDetail,

//       transaction_id: plan.transaction_id,
//       user_id: plan.user_id,
//       expiry_date: plan.expiry_date,

//       days_left_to_expire: daysLeft,
//     };

//     res.status(200).json({
//       success: true,
//       data: filteredResponse,
//     });
//   } catch (error) {
//     console.error("Error fetching latest user plan:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
export const savePlansDataHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { plans } = req.body;

    if (!Array.isArray(plans) || plans.length === 0) {
      res
        .status(400)
        .json({ error: "Payload must contain a non-empty 'plans' array" });
      return;
    }

    const plansCollection = await getCollection("plans");

    let upsertedCount = 0;
    let modifiedCount = 0;

    for (const plan of plans) {
      if (!plan.plan || typeof plan.plan !== "string") continue;

      // Ensure call_limit is an integer, default to 0 if invalid
      const call_limit = parseInt(plan.call_limit, 10);
      plan.call_limit = Number.isNaN(call_limit) ? 0 : call_limit;

      const result = await plansCollection.updateOne(
        { plan: plan.plan }, // match by unique plan name
        { $set: plan },
        { upsert: true }
      );

      if (result.upsertedCount > 0) upsertedCount++;
      if (result.modifiedCount > 0) modifiedCount++;
    }

    res.status(200).json({
      success: true,
      message: "Plans saved/updated successfully",
      upserted: upsertedCount,
      updated: modifiedCount,
    });
  } catch (error) {
    console.error("Error saving plans data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const savePlansDataHandler = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { plans } = req.body;

//     if (!Array.isArray(plans) || plans.length === 0) {
//       res
//         .status(400)
//         .json({ error: "Payload must contain a non-empty 'plans' array" });
//       return;
//     }

//     const plansCollection = await getCollection("plans");

//     let upsertedCount = 0;
//     let modifiedCount = 0;

//     for (const plan of plans) {
//       if (!plan.plan || typeof plan.plan !== "string") continue;

//       const result = await plansCollection.updateOne(
//         { plan: plan.plan }, // match by unique plan name
//         { $set: plan },
//         { upsert: true }
//       );

//       if (result.upsertedCount > 0) upsertedCount++;
//       if (result.modifiedCount > 0) modifiedCount++;
//     }

//     res.status(200).json({
//       success: true,
//       message: "Plans saved/updated successfully",
//       upserted: upsertedCount,
//       updated: modifiedCount,
//     });
//   } catch (error) {
//     console.error("Error saving plans data:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { plan, price, benefits, call_limit } = req.body;

    if (!plan || plan.trim() === '') {
      res.status(400).json({ success: false, message: 'Plan name is required' });
      return;
    }

    const db = await connectToDatabase();

    const updatedFields: any = {
      plan: plan.trim(),
      price: Number(price) || 0,
      benefits: Array.isArray(benefits) ? benefits : [],
      updatedAt: new Date(),
    };

    // Validate and assign call_limit as an integer
    const parsedCallLimit = parseInt(call_limit, 10);
    updatedFields.call_limit = Number.isNaN(parsedCallLimit) ? 0 : parsedCallLimit;

    const result = await db.collection('plans').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFields }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({ success: false, message: 'Plan not found or not updated' });
      return;
    }

    res.status(200).json({ success: true, message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// export const updatePlan = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const { plan, price, benefits } = req.body;

//     if (!plan || plan.trim() === '') {
//       res.status(400).json({ success: false, message: 'Plan name is required' });
//       return;
//     }

//     const db = await connectToDatabase();

//     const result = await db.collection('plans').updateOne(
//       { _id: new ObjectId(id) },
//       {
//         $set: {
//           plan: plan.trim(),
//           price: Number(price) || 0,
//           benefits: Array.isArray(benefits) ? benefits : [],
//           updatedAt: new Date(),
//         },
//       }
//     );

//     if (result.modifiedCount === 0) {
//       res.status(404).json({ success: false, message: 'Plan not found or not updated' });
//       return;
//     }

//     res.status(200).json({ success: true, message: 'Plan updated successfully' });
//   } catch (error) {
//     console.error('Error updating plan:', error);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// };


export const getAllPlansHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const plansCollection = await getCollection("plans");

    // const plans = await plansCollection.find().sort({ id: 1 }).toArray();

    const plans = await plansCollection.find().sort({ price: 1 }).toArray();
    // Use `.sort({ price: -1 })` for descending order if needed

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deletePlanByIdHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: "A valid MongoDB _id is required" });
      return;
    }

    const plansCollection = await getCollection("plans");

    const result = await plansCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Plan with _id ${id} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting plan by _id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const saveTermsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      res.status(400).json({ error: "Valid 'text' string is required" });
      return;
    }

    const termsCollection = await getCollection("termconditions");

    const document = {
      text: text.trim(),
      type: "Terms and Condition",
      created_at: new Date(),
    };

    await termsCollection.insertOne(document);

    res.status(201).json({
      success: true,
      message: "Terms and Condition saved successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const getTermsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const termsCollection = await getCollection("termconditions");

    const terms = await termsCollection
      .find({})
      .sort({ created_at: -1 }) // latest first
      .toArray();

    res.status(200).json({
      success: true,
      data: terms,
    });
  } catch (error) {
    next(error);
  }
};

export const editTermsByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid ID format" });
      return;
    }

    if (!text || typeof text !== "string" || text.trim() === "") {
      res.status(400).json({ error: "Valid 'text' is required" });
      return;
    }

    const termsCollection = await getCollection("termconditions");

    const result = await termsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          text: text.trim(),
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ error: "Term not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Terms and Condition updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTermsByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid ID format" });
      return;
    }

    const termsCollection = await getCollection("termconditions");

    const result = await termsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Term not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Terms and Condition deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
