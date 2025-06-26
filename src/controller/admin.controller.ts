// handlers/userHandler.ts
import { Request, Response } from 'express';
import { connectToDatabase } from '../config/database';
import { ObjectId } from 'mongodb';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await connectToDatabase();
    const users = await db.collection('users').find({}).toArray();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


export const blockUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, message: 'userId is required' });
    return;
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.isBlocked === true) {
      res.status(400).json({ success: false, message: 'User is already blocked' });
      return;
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBlocked: true } }
    );

    res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const unblockUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, message: 'userId is required' });
    return;
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (!user.isBlocked || user.isBlocked === false) {
      res.status(400).json({ success: false, message: 'User is already unblocked' });
      return;
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isBlocked: false } }
    );

    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getBlockedUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const blockedUsers = await usersCollection.find({ isBlocked: true }).toArray();

    res.status(200).json({ success: true, data: blockedUsers });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

import { getCollection } from "../config/database";
export const saveUserPlanHandler = async (req: Request, res: Response): Promise<void> => {
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

    // Validate required fields
    if (!user_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const aiPlansCollection = await getCollection('ai_plans');

    const userObjectId = new ObjectId(user_id);

    // Delete previous plan(s) for the user
    await aiPlansCollection.deleteMany({ user_id: userObjectId });

    // Prepare new plan data
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

    // Insert the new plan
    const result = await aiPlansCollection.insertOne(planData);

    res.status(201).json({
      success: true,
      message: 'Plan saved successfully',
      plan_id: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving user plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


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

     // Normalize plan_detail
    let normalizedPlanDetail: string | undefined = undefined;
    if (typeof plan.plan_detail === "string") {
      normalizedPlanDetail = plan.plan_detail;
    } else if (typeof plan.plan_detail === "object" && plan.plan_detail.plan) {
      normalizedPlanDetail = plan.plan_detail.plan;
    }

    // Only pick allowed fields
    const filteredResponse = {
      // token: plan.token,
      _id : plan._id,
            active_plan: normalizedPlanDetail,

      transaction_id: plan.transaction_id,
      user_id: plan.user_id,
      expiry_date: plan.expiry_date,

      days_left_to_expire: daysLeft,
    };

    res.status(200).json({
      success: true,
      data: filteredResponse,
    });
  } catch (error) {
    console.error("Error fetching latest user plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const savePlansDataHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { plans } = req.body;

    if (!Array.isArray(plans) || plans.length === 0) {
      res.status(400).json({ error: "Payload must contain a non-empty 'plans' array" });
      return;
    }

    const plansCollection = await getCollection("plans");

    let upsertedCount = 0;
    let modifiedCount = 0;

    for (const plan of plans) {
      if (!plan.plan || typeof plan.plan !== "string") continue;

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




export const getAllPlansHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const plansCollection = await getCollection("plans");

    // const plans = await plansCollection.find().sort({ id: 1 }).toArray();
        const plans = await plansCollection.find().sort({ price: 1 }).toArray();


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
