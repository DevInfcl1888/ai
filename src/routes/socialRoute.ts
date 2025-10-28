import { Request, Response } from "express";
import { getCollection } from "../config/database";
import { SocialUser } from "../models/user";
import { ObjectId } from "mongodb";
import {
  buildNewUserHtml,
  sendAdminNotification,
} from "../services/nodemailer";

// export const socialRegisterHandler = async (req: Request, res: Response) => {
//   const { socialId, socialType, user, device_token } = req.body;

//   if (!socialId || !socialType) {
//     res
//       .status(400)
//       .json({ error: "Social ID and social type  are required" });
//     return;
//   }

//   const usersCollection = await getCollection("users");
//   const existingUser = await usersCollection.findOne({
//     $or: [{ socialId, socialType }],
//   });

//   if (existingUser) {
//     res.status(400).json({ error: "User already exists" });
//     return;
//   }

//   const newUser: SocialUser = {
//     socialId,
//     socialType,
//     user,
//     device_token,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     notification:"never",
//     phone_num:"",
//     sms:false,
//     call_count:0,
//   };

//   const result = await usersCollection.insertOne(newUser);
//   res
//     .status(200)
//     .json({
//       success: true,
//       message: "User registered successfully",
//       user: {...result, _id: result.insertedId},
//     });
// };

// export const socialLoginHandler = async (req: Request, res: Response) => {
//   const { socialId, socialType } = req.body;

//   const usersCollection = await getCollection("users");
//   const isUserExists = await usersCollection.findOne({
//     $or: [{ socialId, socialType }],
//   });

//   if (!isUserExists) {
//     res.status(400).json({ error: "User not found" });
//     return;
//   }

//   res.status(200).json({
//     success: true,
//     message: "User logged in successfully",
//     user: isUserExists,
//   });
// };

export const checkUserPhone = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { social_id } = req.body;

    if (!social_id) {
      res
        .status(400)
        .json({ success: false, message: "social_id is required" });
      return;
    }

    const usersCollection = await getCollection("users");

    const user = await usersCollection.findOne({ socialId: social_id });

    if (!user) {
      res.status(404).json({ success: false, message: "No user found" });
      return;
    }

    const hasPhone =
      "phone" in user &&
      typeof user.phone === "string" &&
      user.phone.trim() !== "";

    res.status(200).json({ phone: hasPhone });
  } catch (error) {
    console.error("Error checking phone:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addPhoneBySocialId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { social_id, phone } = req.body;

    if (!social_id || !phone) {
      res
        .status(400)
        .json({ success: false, message: "social_id and phone are required" });
      return;
    }

    const usersCollection = await getCollection("users");

    // Find user by socialId
    const user = await usersCollection.findOne({ socialId: social_id });

    if (!user) {
      res.status(404).json({ success: false, message: "No user found" });
      return;
    }

    // Check if user already has the phone field and it's not empty
    if ("phone" in user && user.phone && user.phone.trim() !== "") {
      res.status(200).json({ success: false, message: "Phone already exists" });
      return;
    }

    // Check if phone exists in any other document
    const phoneInUse = await usersCollection.findOne({
      phone: phone,
      socialId: { $ne: social_id }, // exclude the current user
    });

    if (phoneInUse) {
      res
        .status(409)
        .json({ success: false, message: "Phone number already in use" });
      return;
    }

    // Update user with the phone
    await usersCollection.updateOne(
      { socialId: social_id },
      { $set: { phone: phone, updatedAt: new Date() } }
    );

    res
      .status(200)
      .json({ success: true, message: "Phone number added successfully" });
  } catch (error) {
    console.error("Error adding phone:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const socialRegisterHandler = async (req: Request, res: Response) => {
  const { socialId, socialType, user, device_token, timeZone, schedule } =
    req.body;

  if (!socialId || !socialType) {
    res.status(400).json({ error: "Social ID and social type are required" });
    return;
  }

  const usersCollection = await getCollection("users");
  const blockCollection = await getCollection("block");

  const isBlocked = await blockCollection.findOne({ email: user.email });

  if (isBlocked) {
    res
      .status(403)
      .json({ error: "You are blocked. Please contact the admin." });
    return;
  }
  // const deletedCollection = await getCollection("deletedAccounts");

  // Step 1: Check in users collection
  const existingUser = await usersCollection.findOne({ socialId, socialType });

  if (existingUser) {
    res.status(400).json({ error: "User already exists" });
    return;
  }

  const newUser: SocialUser = {
    socialId,
    socialType,
    user,
    device_token,
    phone: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    notification: "never",
    phone_num: "",
    timeZone: timeZone,
    sms: false,
    call_count: 0,
    schedule: schedule || {},
  };

  const result = await usersCollection.insertOne(newUser);
  (async () => {
    try {
      let type: string;
      let phone: string;
      if (socialType) {
        type = socialType;
        phone = "";
      } else {
        type = "Phone";
      }

      const html = buildNewUserHtml({
        signUpMethod: type,
        socialType: socialType,
        name: user?.name,
        email: user?.email,
        phone: newUser?.phone || phone!,
        createdAt: newUser?.createdAt,
      });
      await sendAdminNotification({
        subject: `New signup: ${type} - ${user?.email || user?.name || ""}`,
        html,
        to: process.env.ADMIN_EMAIL!,
        text: `New signup: ${socialType}, email: ${
          user?.email || "N/A"
        }, phone: ${user?.phone || "N/A"}`,
      });
      console.log("Admin email sent for social signup", result.insertedId);
    } catch (error) {
      return res.status(400).json({ Message: "Email sends fail" });
    }
  })();

  const aiPlansCollection = await getCollection("ai_plans");

  const currentDate = new Date();
  const expiryDate = new Date(currentDate);
  expiryDate.setDate(currentDate.getDate() + 30); // 30 days from now

  // / Step 2: Create AI plan entry for the new user
  const aiPlanEntry = {
    user_id: result.insertedId,
    plan_detail: {
      _id: "", // You might want to generate or use a specific ID
      plan: "Trial",
      benefits: [], // Empty array as requested
      price: 0,
      updatedAt: currentDate.toISOString(),
      call_limit: 1800,
    },
    expiry_date: expiryDate,
    buy_date: currentDate,
    validity: "1 month",
    token: "",
    transaction_id: "", // You might want to generate a transaction ID
    created_at: currentDate,
  };

  await aiPlansCollection.insertOne(aiPlanEntry);

  res.status(200).json({
    success: true,
    message: "User registered successfully",
    user: { ...newUser, _id: result.insertedId },
  });
};

export const socialLoginHandler = async (req: Request, res: Response) => {
  const { socialId, socialType, device_token } = req.body;

  if (!socialId || !socialType) {
    res.status(400).json({ error: "socialId and socialType are required" });
    return;
  }

  const usersCollection = await getCollection("users");

  const isUserExists = await usersCollection.findOne({
    $or: [{ socialId, socialType }],
  });

  if (!isUserExists) {
    res.status(400).json({ error: "User not found" });
    return;
  }

  // Check if the user is blocked
  if (isUserExists.is_blocked === true) {
    res
      .status(403)
      .json({ error: "You are blocked. Please contact the admin." });
    return;
  }

  // Update device_token if it's provided and different
  if (device_token && isUserExists.device_token !== device_token) {
    await usersCollection.updateOne(
      { _id: isUserExists._id },
      { $set: { device_token: device_token } }
    );
    isUserExists.device_token = device_token;
  }

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    user: isUserExists,
  });
};

// export const deleteAccountHandler = async (req: Request, res: Response) => {
//   const userId = req.query.id as string;
//   console.log("Received user ID:", userId);

//   if (!userId || !ObjectId.isValid(userId)) {
//     res.status(400).json({ error: "Valid user ID is required" });
//     return;
//   }

//   const usersCollection = await getCollection("users");

//   const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });
//   console.log("Deleted with ObjectId?", result.deletedCount);

//   if (result.deletedCount === 0) {
//     res.status(404).json({ error: "User not found or already deleted" });
//     return;
//   }

//   res.status(200).json({
//     success: true,
//     message: "User account deleted successfully",
//   });
// };

import Retell from "retell-sdk";

// Initialize Retell client
const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export const deleteAccountHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;
  console.log("Received user ID:", userId);

  if (!userId || !ObjectId.isValid(userId)) {
    res.status(400).json({ error: "Valid user ID is required" });
    return;
  }

  const userObjectId = new ObjectId(userId);
  const usersCollection = await getCollection("users");
  const userDoc = await usersCollection.findOne({ _id: userObjectId });

  if (!userDoc) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    // Track deletion results
    const deletionResults = {
      phoneNumber: false,
      agent: false,
      llm: false,
      user: false,
    };

    // Delete Retell phone number if exists
    if (userDoc.ai_number) {
      try {
        await retellClient.phoneNumber.delete(userDoc.ai_number);
        deletionResults.phoneNumber = true;
        console.log("Deleted phone number from Retell:", userDoc.ai_number);
      } catch (error) {
        console.error("Error deleting phone number from Retell:", error);
        // Continue with deletion process even if phone number deletion fails
      }
    }

    // Delete Retell agent if exists
    if (userDoc.agent_id) {
      try {
        await retellClient.agent.delete(userDoc.agent_id);
        deletionResults.agent = true;
        console.log("Deleted agent from Retell:", userDoc.agent_id);
      } catch (error) {
        console.error("Error deleting agent from Retell:", error);
        // Continue with deletion process even if agent deletion fails
      }
    }

    // Delete Retell LLM if exists
    if (userDoc.llm_id) {
      try {
        await retellClient.llm.delete(userDoc.llm_id);
        deletionResults.llm = true;
        console.log("Deleted LLM from Retell:", userDoc.llm_id);
      } catch (error) {
        console.error("Error deleting LLM from Retell:", error);
        // Continue with deletion process even if LLM deletion fails
      }
    }

    // Delete user from database
    const deleteResult = await usersCollection.deleteOne({ _id: userObjectId });
    deletionResults.user = deleteResult.deletedCount > 0;
    console.log("Deleted from users?", deleteResult.deletedCount);

    if (deleteResult.deletedCount === 0) {
      res.status(500).json({
        error: "Failed to delete user from database",
        deletionResults,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message:
        "User account and associated Retell resources deleted successfully",
      deletionResults,
    });
  } catch (error) {
    console.error("Error during account deletion:", error);
    res.status(500).json({
      error: "An error occurred during account deletion",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
// export const deleteAccountHandler = async (req: Request, res: Response) => {
//   const userId = req.query.id as string;
//   console.log("Received user ID:", userId);

//   if (!userId || !ObjectId.isValid(userId)) {
//     res.status(400).json({ error: "Valid user ID is required" });
//     return;
//   }

//   const userObjectId = new ObjectId(userId);
//   const usersCollection = await getCollection("users");
//   const userDoc = await usersCollection.findOne({ _id: userObjectId });

//   if (!userDoc) {
//     res.status(404).json({ error: "User not found" });
//     return;
//   }
//   const deleteResult = await usersCollection.deleteOne({ _id: userObjectId });
//   console.log("Deleted from users?", deleteResult.deletedCount);

//   res.status(200).json({
//     success: true,
//     message: "User account moved to deletedAccounts successfully",
//   });
// };
