// src/controllers/businessController.ts
import { Request, Response } from 'express';
import { getCollection } from '../config/database';
import { Business } from '../models/businessModel';

// export const createBusiness = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const businessData: Business = req.body;

//     if (!businessData.userId || !businessData.businessName) {
//       res.status(400).json({ error: 'userId and businessName are required.' });
//       return;
//     }

//     const businessCollection = await getCollection('business');
//     const result = await businessCollection.insertOne(businessData);

//     res.status(201).json({
//       message: 'Business created successfully',
//       businessId: result.insertedId,
//     });
//   } catch (error) {
//     console.error('Error saving business:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

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

    const now = new Date();

    const documentToInsert = {
      ...businessData,
      Title: 'new',
      Response: '',
      Status: 'pending',
      created_at: now,
      updated_at: now,
    };

    const businessCollection = await getCollection('business');
    const result = await businessCollection.insertOne(documentToInsert);

    res.status(201).json({
      message: 'Business created successfully',
      businessId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getBusinessByUserId = async (req: Request, res: Response) : Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
       res.status(400).json({ error: 'userId is required in URL params' });
    }

    const businessCollection = await getCollection('business');
    // const businessData = await businessCollection.findOne({ userId });
    const businessData = await businessCollection.find({ userId }).toArray();


    if (!businessData) {
       res.status(404).json({ message: 'No business found for this userId' });
    }

    res.status(200).json({ business: businessData });
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


import { ObjectId } from 'mongodb';

export const updateBusinessById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedFields = req.body;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid business ID' });
      return;
    }

    const businessCollection = await getCollection('business');

    // Only update provided fields + forced updates
    const updatePayload = {
      ...updatedFields,
      Title: 'repost',
      Status: 'pending',
      updated_at: new Date()
    };

    const result = await businessCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    res.status(200).json({ message: 'Business updated successfully' });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



export const updateBusinessStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, Title, Status, Response: ResponseField } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid or missing business ID' });
      return;
    }

    const allowedValues = ['in-review', 'rejected', 'repost', 'approved', 'pending'];

    const updateFields: any = {
      updated_at: new Date()
    };

    if (Status !== undefined) {
      if (!allowedValues.includes(Status)) {
        res.status(400).json({ error: `Invalid Status value. Allowed values: ${allowedValues.join(', ')}` });
        return;
      }
      updateFields.Status = Status;
    }

    if (ResponseField !== undefined) {
      updateFields.Response = ResponseField;
    }

    const businessCollection = await getCollection('business');

    const result = await businessCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    res.status(200).json({ message: 'Business updated successfully' });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBusinessByTitle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.query;

    if (!title) {
      res.status(400).json({ error: 'Title query parameter is required' });
      return;
    }

    const allowedTitles = ['new', 'in-review', 'rejected', 'repost', 'approved'];
    const inputTitle = String(title).toLowerCase();

    if (!allowedTitles.includes(inputTitle)) {
      res.status(400).json({ error: `Invalid Title. Allowed values are: ${allowedTitles.join(', ')}` });
      return;
    }

    const businessCollection = await getCollection('business');

    const results = await businessCollection.find({ Status: inputTitle }).toArray();

    res.status(200).json({ data: results });
  } catch (error) {
    console.error('Error fetching business data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};