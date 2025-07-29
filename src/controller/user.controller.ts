import { Request, Response } from 'express';
import { getCollection } from '../config/database'; // assume helper to get MongoDB collection



export const blockUser = async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ message: "Phone is required" });
    return;
  }

  try {
    const blockCollection = await getCollection("block");
    const usersCollection = await getCollection("users");

    // Check if already in VIP
    const existing = await blockCollection.findOne({ phone });
    if (existing) {
      res.status(409).json({ message: "Phone already in blocked list" });
      return;
    }

    // Insert into VIP list
    await blockCollection.insertOne({ phone });

    // Update user if found
    const user = await usersCollection.findOne({ phone });
    if (user) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { is_blocked: true } }
      );
    }

    res.status(201).json({ message: "Phone added to blocked list" });
  } catch (err) {
    res.status(500).json({ message: "Error adding phone", error: err });
  }
};
export const getBlocks = async (_req: Request, res: Response) => {
  try {
    const blockCollection = await getCollection("block");
    const blocked = await blockCollection.find().toArray();
    res.json(blocked);
  } catch (err) {
    res.status(500).json({ message: "Error fetching blocked list", error: err });
  }
};


export const deleteBlock = async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.params;

  try {
    const blockCollection = await getCollection("block");
    const usersCollection = await getCollection("users");

    const result = await blockCollection.deleteOne({ phone });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Phone not found in Block list" });
      return;
    }

    // Remove `type` field from user if present
    const user = await usersCollection.findOne({ phone });
    if (user && user.type) {
      await usersCollection.updateOne(
        { _id: user._id },
        { $unset: { is_blocked: false } }
      );
    }

    res.json({ message: "Phone removed from Block list" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting phone", error: err });
  }
};