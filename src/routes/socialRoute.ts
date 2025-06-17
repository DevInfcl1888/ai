import { Request, Response } from "express";
import { getCollection } from "../config/database";
import { SocialUser } from "../models/user";
import { ObjectId } from "mongodb";

export const socialRegisterHandler = async (req: Request, res: Response) => {
  const { socialId, socialType, user } = req.body;

  if (!socialId || !socialType) {
    res
      .status(400)
      .json({ error: "Social ID and social type  are required" });
    return;
  }

  const usersCollection = await getCollection("users");
  const existingUser = await usersCollection.findOne({
    $or: [{ socialId, socialType }],
  });

  if (existingUser) {
    res.status(400).json({ error: "User already exists" });
    return;
  }

  const newUser: SocialUser = {
    socialId,
    socialType,
    user,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await usersCollection.insertOne(newUser);
  res
    .status(200)
    .json({
      success: true,
      message: "User registered successfully",
      user: {...result, _id: result.insertedId},
    });
};


export const socialLoginHandler = async (req: Request, res: Response) => {
  const { socialId, socialType } = req.body;

  const usersCollection = await getCollection("users");
  const isUserExists = await usersCollection.findOne({
    $or: [{ socialId, socialType }],
  });

  if (!isUserExists) {
    res.status(400).json({ error: "User not found" });
    return;
  }

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    user: isUserExists,
  });
};
