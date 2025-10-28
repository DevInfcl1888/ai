// export default router;
import express, { Request, Response, NextFunction } from "express";
import { sendOtp, verifyOtp } from "../services/otpService";
import { getCollection } from "../config/database";
import { User } from "../models/user";
import { ObjectId } from "mongodb";
import {
  buildNewUserHtml,
  sendAdminNotification,
} from "../services/nodemailer";

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
    const { phoneNumber, otp, type, device_token, timeZone, schedule } =
      req.body;
    console.log("device", device_token);

    if (!phoneNumber || !otp) {
      res.status(400).json({ error: "Phone number and OTP are required" });
      return;
    }

    // Custom override for specific number
    let isVerified = false;
    if (phoneNumber === "+19123912391" && otp === "123456") {
      isVerified = true;
    } else {
      isVerified = verifyOtp(phoneNumber, otp);
    }

    const usersCollection = await getCollection("users");
    const blockCollection = await getCollection("block");
    const isBlocked = await blockCollection.findOne({ phone: phoneNumber });

    if (isBlocked) {
      res
        .status(403)
        .json({ error: "You are blocked. Please contact the admin." });
      return;
    }

    const existingUser = await usersCollection.findOne({ phone: phoneNumber });

    if (isVerified) {
      if (existingUser && device_token) {
        // If user has no device_token or a different one, update it
        if (
          !existingUser.device_token ||
          existingUser.device_token !== device_token
        ) {
          await usersCollection.updateOne(
            { _id: existingUser._id },
            { $set: { device_token: device_token } }
          );
          existingUser.device_token = device_token;
        }
      }

      if (type === "register") {
        const result = await registerUser(
          phoneNumber,
          device_token,
          timeZone,
          schedule
        );
        // varun
        (async () => {
          let type: string;
          let phone: string;
          if (existingUser?.socialType) {
            type = existingUser.socialType;
            phone = " ";
          } else {
            type = "Phone";
          }
          const html = buildNewUserHtml({
            //   signUpMethod: type,
            //   phone: phone,
            //   createdAt: new Date(),
            //   name: existingUser?.user?.name,
            //   email: existingUser?.user?.email,
            // });

            name: existingUser?.name,
            email: existingUser?.email,
            phone: existingUser?.phone ? existingUser?.phone : phone!, // if not found then  (---)
            // aiNumber: usersCollection?.ai_number!, // -  +1-78945123
            // date: formattedDate, // - 28 oct 2025
            createdAt: existingUser?.createdAt, // 05:30:00 UTC
            signUpMethod: type,
            socialType: type, //Google / Apple
            status: isBlocked === true ? "Block" : "Active",
          });
          await sendAdminNotification({
            subject: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
    <h2 style="color: #2c3e50; margin-bottom: 10px;">
      Welcome to <strong>AI Secretary</strong> - New User Registered via (${
        type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
      })
    </h2></div>`,
            to: process.env.ADMIN_EMAIL!,
            html,
            // to: process.env.ADMIN_EMAIL!,
            // text: `New signup: ${socialType}, email: ${
            //   user?.email || "N/A"
            // }, phone: ${user?.phone || "N/A"}`,
            // html,

            // subject: `New signup: ${type} - ${
            //   existingUser?.user?.email || existingUser?.user?.name || ""
            // }`,
            // text: `New signup: ${existingUser?.socialType}, email: ${
            //   existingUser?.user?.email || "N/A"
            // }, phone: ${existingUser?.user?.phone || "N/A"}`,
          });
        })();

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

// export async function verifyOTPhandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const { phoneNumber, otp, type, device_token, timeZone, schedule } = req.body;
//     console.log("device", device_token);

//     if (!phoneNumber || !otp) {
//       res.status(400).json({ error: "Phone number and OTP are required" });
//       return;
//     }

//     const isVerified = verifyOtp(phoneNumber, otp);
//     const usersCollection = await getCollection("users");
//     const blockCollection = await getCollection("block");
//     const isBlocked = await blockCollection.findOne({ phone: phoneNumber });

//     if (isBlocked) {
//       res.status(403).json({ error: "You are blocked. Please contact the admin." });
//       return;
//     }

//     const existingUser = await usersCollection.findOne({ phone: phoneNumber });

//     if (isVerified) {
//       if (existingUser && device_token) {
//         // If user has no device_token or a different one, update it
//         if (!existingUser.device_token || existingUser.device_token !== device_token) {
//           await usersCollection.updateOne(
//             { _id: existingUser._id },
//             { $set: { device_token: device_token } }
//           );
//           existingUser.device_token = device_token;
//         }
//       }

//       if (type === "register") {
//         const result = await registerUser(phoneNumber, device_token, timeZone, schedule);
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

async function registerUser(
  phoneNumber: string,
  device_token: string,
  TimeZone: string,
  schedule: any
) {
  const usersCollection = await getCollection("users");
  const aiPlansCollection = await getCollection("ai_plans");
  const vipCollection = await getCollection("vip");
  const blockCollection = await getCollection("block");

  const currentDate = new Date();
  const expiryDate = new Date(currentDate);
  expiryDate.setDate(currentDate.getDate() + 30); // 30 days from now

  // // Check if user is VIP
  // const isVIP = await vipCollection.findOne({ phone: phoneNumber });
  // Check if user is VIP
  const isVIP = await vipCollection.findOne({ phone: phoneNumber });

  // Check if user is Blocked
  const isBlocked = await blockCollection.findOne({ phone: phoneNumber });

  const newUser: any = {
    phone: phoneNumber,
    createdAt: currentDate,
    updatedAt: currentDate,
    phone_num: "",
    notification: "never",
    sms: false,
    call_count: 0,
    device_token: device_token || "",
    timeZone: TimeZone || "",
    schedule: schedule || {},
    ...(isVIP && { type: "free" }), // <-- save "type": "free" if VIP
    ...(isBlocked && { is_blocked: true }), // add "is_blocked": true if blocked
  };

  const result = await usersCollection.insertOne(newUser);

  const aiPlanEntry = {
    user_id: result.insertedId,
    plan_detail: {
      _id: "",
      plan: "Trial",
      benefits: [],
      price: 0,
      updatedAt: currentDate.toISOString(),
      call_limit: isVIP ? "" : 1800, // <-- empty if VIP
    },
    expiry_date: expiryDate,
    buy_date: currentDate,
    validity: "1 month",
    token: "",
    transaction_id: "",
    created_at: currentDate,
  };

  await aiPlansCollection.insertOne(aiPlanEntry);

  return {
    id: result.insertedId,
    device_token: device_token,
    phone: phoneNumber,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
    ...(isVIP && { type: "free" }), // <-- returned in response also
  };
}

export default router;
