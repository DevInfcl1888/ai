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
