import { Request, Response } from "express";
import { getCollection } from "../config/database";
import { sendOtp } from "../services/otpService";
import { ObjectId } from "mongodb";

export const loginHandler = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

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


export const getProfileHandler = async (req: Request, res: Response) => {
  const userId = req.query.id as string;

  const usersCollection = await getCollection("users");
  const existingUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

  if (!existingUser) {
    res.status(400).json({ error: "User not found" });
    return;
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: existingUser,
  });
};

