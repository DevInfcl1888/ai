// export default router;
import express, { Request, Response, NextFunction } from "express";
import { sendOtp, verifyOtp } from "../services/otpService";
import { getCollection } from "../config/database";
import { User } from "../models/user";
import { ObjectId } from "mongodb";

const router = express.Router();

export async function sendOtpHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP

    const usersCollection = await getCollection("users");
    const existingUser = await usersCollection.findOne({
      $or: [{ phone: phoneNumber }],
    });

    if (existingUser) {
      // if (existingUser.isBlocked === true) {
      //   res.status(403).json({ error: "You are blocked. Please contact the admin." });
      //   return;
      // }

      res.status(400).json({ error: "User already exists" });
      return;
    }

    await sendOtp(phoneNumber, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error: any) {
    if (
      error.message &&
      error.message.toLowerCase().includes("invalid 'to' phone number")
    ) {
      res.status(400).json({ error: "Phone number is invalid" });
      return;
    }

    next(error);
  }
}

/**
 * Endpoint to verify OTP
 * POST /otp/verify
 * Body: { phoneNumber: string, otp: string }
 */
// export async function verifyOTPhandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const { phoneNumber, otp, type, device_token } = req.body;
//     console.log("device", device_token)

//     if (!phoneNumber || !otp) {
//       res.status(400).json({ error: "Phone number and OTP are required" });
//       return;
//     }

//     const isVerified = verifyOtp(phoneNumber, otp);
//     const usersCollection = await getCollection("users");
//     const existingUser = await usersCollection.findOne({ phone: phoneNumber });

//     if (isVerified) {
//       if (type === "register") {
//         const result = await registerUser(phoneNumber, device_token);
//         res.status(200).json({
//           success: true,
//           message: "User registered successfully",
//           data: {...result, _id: new ObjectId(result.id)},
//         });
//       } else {
//         res.status(200).json({
//           success: true,
//           message: "User logged in successfully",
//           data: existingUser,
//         });
//       }
//     } else {
//       res.status(400).json({ error: "Entered OTP must be wrong or expired" });
//     }
//   } catch (error) {
//     next(error);
//   }
// }
// export async function verifyOTPhandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const { phoneNumber, otp, type, device_token } = req.body;
//     console.log("device", device_token);

//     if (!phoneNumber || !otp) {
//       res.status(400).json({ error: "Phone number and OTP are required" });
//       return;
//     }

//     const isVerified = verifyOtp(phoneNumber, otp);
//     const usersCollection = await getCollection("users");
//     const deletedCollection = await getCollection("deletedAccounts");

//     let existingUser = await usersCollection.findOne({ phone: phoneNumber });

//     if (isVerified) {
//       // Check in deletedAccounts if not found in users
//       if (!existingUser) {
//         const deletedUser = await deletedCollection.findOne({ phone: phoneNumber });

//         if (deletedUser) {
//           // Remove deletedDate before restoring
//           const { deletedDate, ...restoredUser } = deletedUser;

//           // Insert back into users
//           await usersCollection.insertOne({
//             ...restoredUser,
//             updatedAt: new Date(),
//             device_token: device_token || restoredUser.device_token || null,
//           });

//           // Delete from deletedAccounts
//           await deletedCollection.deleteOne({ _id: deletedUser._id });

//           // Update reference
//           existingUser = await usersCollection.findOne({ phone: phoneNumber });
//         }
//       }

//       // Update device token if needed
//       if (existingUser && device_token) {
//         if (!existingUser.device_token || existingUser.device_token !== device_token) {
//           await usersCollection.updateOne(
//             { _id: existingUser._id },
//             { $set: { device_token: device_token } }
//           );
//           existingUser.device_token = device_token;
//         }
//       }

//       if (type === "register") {
//         const result = await registerUser(phoneNumber, device_token);
//         res.status(200).json({
//           success: true,
//           message: "User registered successfully",
//           data: { ...result, _id: new ObjectId(result.id) },
//         });
//       } else {
//         res.status(200).json({
//           success: true,
//           message: "User logged in successfully",
//           data: existingUser,
//         });
//       }
//     } else {
//       res.status(400).json({ error: "Entered OTP must be wrong or expired" });
//     }
//   } catch (error) {
//     next(error);
//   }
// }

// async function registerUser(phoneNumber: string, device_token: string) {
//   const newUser: User = {
//     phone: phoneNumber,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     phone_num: "",
//     notification: "never",
//     sms: false,
//     call_count: 0,
//     device_token: device_token || "",
//   };

//   const usersCollection = await getCollection("users");
//   const result = await usersCollection.insertOne(newUser);

//   return {
//     id: result.insertedId,
//     device_token,
//     phone: phoneNumber,
//     createdAt: newUser.createdAt,
//     updatedAt: newUser.updatedAt,
//   };
// }

export async function verifyOTPhandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phoneNumber, otp, type, device_token } = req.body;
    console.log("device", device_token);

    if (!phoneNumber || !otp) {
      res.status(400).json({ error: "Phone number and OTP are required" });
      return;
    }

    const isVerified = verifyOtp(phoneNumber, otp);
    const usersCollection = await getCollection("users");
    const existingUser = await usersCollection.findOne({ phone: phoneNumber });

    if (isVerified) {
      if (existingUser && device_token) {
        // If user has no device_token or a different one, update it
        if (!existingUser.device_token || existingUser.device_token !== device_token) {
          await usersCollection.updateOne(
            { _id: existingUser._id },
            { $set: { device_token: device_token } }
          );
          existingUser.device_token = device_token;
        }
      }

      if (type === "register") {
        const result = await registerUser(phoneNumber, device_token);
        res.status(200).json({
          success: true,
          message: "User registered successfully",
          data: { ...result, _id: new ObjectId(result.id) },
        });
      } else {
        res.status(200).json({
          success: true,
          message: "User logged in successfully",
          data: existingUser,
        });
      }
    } else {
      res.status(400).json({ error: "Entered OTP must be wrong or expired" });
    }
  } catch (error) {
    next(error);
  }
}


async function registerUser(phoneNumber: string , device_token: string ) {
  const newUser: User = {
    phone: phoneNumber,
    createdAt: new Date(),
    updatedAt: new Date(),
    phone_num: "",
    notification: "never",
    sms: false,
    call_count: 0, // <-- added this line
    device_token: device_token || "",

  };

  const usersCollection = await getCollection("users");
  const result = await usersCollection.insertOne(newUser);
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
      call_limit: 1800
    },
    expiry_date: expiryDate,
    buy_date: currentDate,
    validity: "1 month",
    token: "",
    transaction_id: "", // You might want to generate a transaction ID
    created_at: currentDate
  };

  await aiPlansCollection.insertOne(aiPlanEntry);

  return {
    id: result.insertedId,
    device_token : device_token,
    phone: phoneNumber,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
}

export default router;
