import { Request, Response } from "express";
import { getCollection } from "../config/database";
import { SocialUser } from "../models/user";
import { ObjectId } from "mongodb";

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



export const socialRegisterHandler = async (req: Request, res: Response) => {
  const { socialId, socialType, user, device_token } = req.body;

  if (!socialId || !socialType) {
    res.status(400).json({ error: "Social ID and social type are required" });
    return;
  }

  const usersCollection = await getCollection("users");
  const deletedCollection = await getCollection("deletedAccounts");

  // Step 1: Check in users collection
  const existingUser = await usersCollection.findOne({ socialId, socialType });

  if (existingUser) {
    res.status(400).json({ error: "User already exists" });
    return;
  }

  // // Step 2: Check in deletedAccounts
  // const deletedUser = await deletedCollection.findOne({ socialId, socialType });

  // if (deletedUser) {
  //   const { deletedDate, _id, ...restoredUserFields } = deletedUser;

  //   const revivedUser: SocialUser = {
  //     socialId: restoredUserFields.socialId,
  //     socialType: restoredUserFields.socialType,
  //     user: restoredUserFields.user,
  //     device_token: device_token || restoredUserFields.device_token || null,
  //     createdAt: restoredUserFields.createdAt || new Date(),
  //     updatedAt: new Date(),
  //     notification: restoredUserFields.notification || "never",
  //     phone_num: restoredUserFields.phone_num || "",
  //     sms: restoredUserFields.sms ?? false,
  //     call_count: restoredUserFields.call_count ?? 0,
  //   };

  //   const insertResult = await usersCollection.insertOne(revivedUser);
  //   await deletedCollection.deleteOne({ _id });

  //   res.status(200).json({
  //     success: true,
  //     message: "User restored from deleted accounts",
  //     user: { ...revivedUser, _id: insertResult.insertedId },
  //   });
  //   return;
  // }

  // Step 3: Register new user
  const newUser: SocialUser = {
    socialId,
    socialType,
    user,
    device_token,
    createdAt: new Date(),
    updatedAt: new Date(),
    notification: "never",
    phone_num: "",
    sms: false,
    call_count: 0,
  };

  const result = await usersCollection.insertOne(newUser);

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
  if (isUserExists.isBlocked === true) {
    res.status(403).json({ error: "You are blocked. Please contact the admin." });
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


export const deleteAccountHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;
  console.log("Received user ID:", userId);

  if (!userId || !ObjectId.isValid(userId)) {
    res.status(400).json({ error: "Valid user ID is required" });
    return;
  }

  const userObjectId = new ObjectId(userId);
  const usersCollection = await getCollection("users");
  const deletedAccountsCollection = await getCollection("deletedAccounts");

  // Step 1: Find the user
  const userDoc = await usersCollection.findOne({ _id: userObjectId });

  if (!userDoc) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // // Step 2: Insert into deletedAccounts with deletedDate
  // const insertResult = await deletedAccountsCollection.insertOne({
  //   ...userDoc,
  //   deletedDate: new Date(), // <-- added deletedDate here
  // });

  // if (!insertResult.acknowledged) {
  //   res.status(500).json({ error: "Failed to archive user account" });
  //   return;
  // }

  // Step 3: Delete from users collection
  const deleteResult = await usersCollection.deleteOne({ _id: userObjectId });
  console.log("Deleted from users?", deleteResult.deletedCount);

  res.status(200).json({
    success: true,
    message: "User account moved to deletedAccounts successfully",
  });
};
