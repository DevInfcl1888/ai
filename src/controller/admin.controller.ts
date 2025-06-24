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
    if (!user_id ) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const aiPlansCollection = await getCollection('ai_plans');

    const planData = {
      user_id: new ObjectId(user_id),
      plan_detail,
      expiry_date: new Date(expiry_date),
      buy_date: new Date(buy_date),
      validity,
      token,
      transaction_id,
      created_at: new Date(),
    };

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
