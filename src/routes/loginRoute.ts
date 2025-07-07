import { Request, Response, NextFunction } from "express";
import { getCollection } from "../config/database";
import { sendOtp } from "../services/otpService";
import { ObjectId } from "mongodb";

// export const loginHandler = async (req: Request, res: Response) => {
//   const { phoneNumber } = req.body;

//   if (!phoneNumber) {
//     res.status(400).json({ error: "Phone number is required" });
//     return;
//   }

//   const usersCollection = await getCollection("users");
//   const existingUser = await usersCollection.findOne({
//     $or: [{ phone: phoneNumber }],
//   });

//   if (!existingUser) {
//     res.status(400).json({ error: "User not found" });
//     return;
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   await sendOtp(phoneNumber, otp);

//   res.status(200).json({
//     success: true,
//     message: "User logged in successfully",
//     data: existingUser,
//   });
// };


// export const loginHandler = async (req: Request, res: Response): Promise<void> => {
//   const { phoneNumber, device_token } = req.body;
//   console.log("device_token",device_token)

//   if (!phoneNumber) {
//     res.status(400).json({ error: "Phone number is required" });
//   }

//   const usersCollection = await getCollection("users");
//   const existingUser = await usersCollection.findOne({
//     $or: [{ phone: phoneNumber }],
//   });

//   if (!existingUser) {
//     res.status(400).json({ error: "User not found" });
//     return;
//   }

//   // Replace device_token if it's different
//   if (device_token && existingUser.device_token !== device_token) {
//     await usersCollection.updateOne(
//       { _id: existingUser._id },
//       { $set: { device_token: device_token } }
//     );
//     existingUser.device_token = device_token;
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   await sendOtp(phoneNumber, otp);

//    res.status(200).json({
//     success: true,
//     message: "User logged in successfully",
//     data: existingUser,
//   });
// };

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber, device_token } = req.body;
  console.log("device_token", device_token);

  if (!phoneNumber) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }

  const usersCollection = await getCollection("users");
  const existingUser = await usersCollection.findOne({
    $or: [{ phone: phoneNumber }],
  });

  if (!existingUser) {
    res.status(400).json({ error: "User not found" });
    return;
  }

  // Check if the user is blocked
  if (existingUser.isBlocked === true) {
    res.status(403).json({ error: "You are blocked. Please contact the admin." });
    return;
  }

  // Replace device_token if it's different
  if (device_token && existingUser.device_token !== device_token) {
    await usersCollection.updateOne(
      { _id: existingUser._id },
      { $set: { device_token: device_token } }
    );
    existingUser.device_token = device_token;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await sendOtp(phoneNumber, otp);

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: existingUser,
  });
};



export const editProfileHandler = async (req: Request, res: Response) => {
    const userId = req.query.id as string;
    if (!ObjectId.isValid(userId)) {
     res.status(400).json({ error: "Invalid user ID format" });
     return;
  }

  const usersCollection = await getCollection("users");
  const existingUser = await usersCollection.findOne({  _id: new ObjectId(userId) });

  if (!existingUser) {
    res.status(400).json({ error: "User not found" });
    return;
  }

  const updatedUser = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: req.body }
  );

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
};


// export const getProfileHandler = async (req: Request, res: Response) => {
//   const userId = req.query.id as string;
//   if (!ObjectId.isValid(userId)) {
//     res.status(400).json({ error: "Invalid user ID format" });
//     return;
//   }

//   const usersCollection = await getCollection("users");
//   const existingUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

//   if (!existingUser) {
//     res.status(400).json({ error: "User not found" });
//     return;
//   }

//   res.status(200).json({
//     success: true,
//     message: "User fetched successfully",
//     data: existingUser,
//   });
// };




// export const updateUserPreferencesHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { userId, notification, sms, phone_num } = req.body;
//     console.log(userId, notification, sms, phone_num);

//     if (!userId || !ObjectId.isValid(userId)) {
//       res.status(400).json({ error: "Valid user ID is required" });
//       return;
//     }

//     const isNotificationProvided = typeof notification === "string" && ["always", "never","interested"].includes(notification);
//     const isSmsProvided = typeof sms === "boolean";

//     // Enforce only one preference at a time
//     if ((isNotificationProvided && isSmsProvided) || (!isNotificationProvided && !isSmsProvided)) {
//       res.status(400).json({
//         error: "Send either 'notification' (as 'always', 'never','interested') or 'sms' (as boolean) — only one at a time.",
//       });
//       return;
//     }

//     const usersCollection = await getCollection("users");
//     const userObjectId = new ObjectId(userId);

//     const existingUser = await usersCollection.findOne({ _id: userObjectId });

//     if (!existingUser) {
//       res.status(404).json({ error: "User not found" });
//       return;
//     }

//     const updateField: Partial<{ notification: string; sms: boolean; contact: string }> = {};

//     if (isNotificationProvided) {
//       updateField.notification = notification;
//     } else if (isSmsProvided) {
//       updateField.sms = sms;

//       if (sms === true && phone_num && typeof phone_num === "string" && phone_num.trim() !== "") {
//         updateField.contact = phone_num.trim();
//       }
//     }

//     await usersCollection.updateOne(
//       { _id: userObjectId },
//       { $set: updateField }
//     );

//     res.status(200).json({
//       success: true,
//       message: "User preference updated successfully",
//       updated: updateField,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

import dayjs from "dayjs";

export const getProfileHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;

  if (!ObjectId.isValid(userId)) {
    res.status(400).json({ error: "Invalid user ID format" });
    return;
  }

  const usersCollection = await getCollection("users");
  const plansCollection = await getCollection("ai_plans");

  const userObjectId = new ObjectId(userId);
  const existingUser = await usersCollection.findOne({ _id: userObjectId });

  if (!existingUser) {
    res.status(400).json({ error: "User not found" });
    return;
  }

  let planStatus = {
    status: "no active plans",
    plan_name: "",
    expiry_date: "",
        benefits: [],

  };

  const userPlans = await plansCollection
    .find({ user_id: userObjectId })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray();

  if (userPlans.length > 0) {
    const latestPlan = userPlans[0];
    const today = dayjs().startOf("day");
    const expiryDate = dayjs(latestPlan.expiry_date);

    planStatus = {
      plan_name: latestPlan.plan_detail?.plan || "",
      benefits: latestPlan.plan_detail?.benefits || [],

      expiry_date: expiryDate.toISOString(),
      status: expiryDate.isBefore(today) ? "expired" : "active"
    };
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: {
      ...existingUser,
      plan_status: planStatus,
    },
  });
};


export const updateUserPreferencesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, notification, sms, phone_num, sms_type } = req.body;
    console.log(userId, notification, sms, phone_num, sms_type);

    if (!userId || !ObjectId.isValid(userId)) {
      res.status(400).json({ error: "Valid user ID is required" });
      return;
    }

    const isNotificationProvided =
      typeof notification === "string" &&
      ["always", "never", "interested"].includes(notification);

    const isSmsProvided = typeof sms === "boolean";

    // Enforce only one preference at a time (notification or sms)
    if ((isNotificationProvided && isSmsProvided) || (!isNotificationProvided && !isSmsProvided)) {
      res.status(400).json({
        error: "Send either 'notification' (as 'always', 'never', 'interested') or 'sms' (as boolean) — only one at a time.",
      });
      return;
    }

    // Validate sms_type if provided
    const isSmsTypeValid =
      !sms_type || (typeof sms_type === "string" && ["always", "never", "interested"].includes(sms_type));

    if (!isSmsTypeValid) {
      res.status(400).json({
        error: "Invalid 'sms_type'. Allowed values are: 'always', 'never', 'interested'.",
      });
      return;
    }

    const usersCollection = await getCollection("users");
    const userObjectId = new ObjectId(userId);

    const existingUser = await usersCollection.findOne({ _id: userObjectId });

    if (!existingUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const updateField: Partial<{
      notification: string;
      sms: boolean;
      contact: string;
      sms_type: string;
    }> = {};

    if (isNotificationProvided) {
      updateField.notification = notification;
    } else if (isSmsProvided) {
      updateField.sms = sms;
      if (sms === true && phone_num && typeof phone_num === "string" && phone_num.trim() !== "") {
        updateField.contact = phone_num.trim();
      }
    }

    if (sms_type) {
      updateField.sms_type = sms_type;
    }

    await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: updateField }
    );

    res.status(200).json({
      success: true,
      message: "User preference updated successfully",
      updated: updateField,
    });
  } catch (error) {
    next(error);
  }
};

