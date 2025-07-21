// src/controllers/businessController.ts
import { Request, Response } from 'express';
import { getCollection } from '../config/database';
import { Business } from '../models/businessModel';

export const createBusiness = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const businessData: Business = req.body;

    if (!businessData.userId || !businessData.businessName) {
      res.status(400).json({ error: 'userId and businessName are required.' });
      return;
    }

    const businessCollection = await getCollection('business');
    const result = await businessCollection.insertOne(businessData);

    res.status(201).json({
      message: 'Business created successfully',
      businessId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
