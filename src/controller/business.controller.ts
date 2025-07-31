// src/controllers/businessController.ts
import { Request, Response } from 'express';
import { getCollection } from '../config/database';
import { Business } from '../models/businessModel';
import { push } from '../services/sendPushNotification'; // adjust path


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
// import { push } from '..//services/sendPushNotification'; // adjust path

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
      term: 'new',
      is_payment: false,
      is_active: false,
      expiry_at: "",
      created_at: now,
      updated_at: now,
    };

    const businessCollection = await getCollection('business');
    const result = await businessCollection.insertOne(documentToInsert);

    // Send push notification to user
    try {
      const usersCollection = await getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(businessData.userId) });
      
      if (user && user.device_token) {
        await push(
          user.device_token,
          'Business Created Successfully',
          `Your business "${businessData.businessName}" has been created successfully and is pending approval.`
        );
        console.log('✅ Push notification sent for business creation');
      } else {
        console.log('⚠️ User not found or device token not available for push notification');
      }
    } catch (notificationError) {
      // Log the error but don't fail the entire request
      console.error('❌ Failed to send push notification:', notificationError);
    }

    res.status(201).json({
      message: 'Business created successfully',
      businessId: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

//     const now = new Date();

//     const documentToInsert = {
//       ...businessData,
//       Title: 'new',
//       Response: '',
//       Status: 'pending',
//       term : 'new',
//       is_payment: false,
//       is_active: false,
//       expiry_at: "",
//       created_at: now,
//       updated_at: now,
//     };

//     const businessCollection = await getCollection('business');
//     const result = await businessCollection.insertOne(documentToInsert);

//     res.status(201).json({
//       message: 'Business created successfully',
//       businessId: result.insertedId,
//     });
//   } catch (error) {
//     console.error('Error saving business:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };


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

export const updateBusinessPaymentById = async (req: Request, res: Response): Promise<void> => {
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
      term : 'repost',
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



// export const updateBusinessStatus = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id, Title, Status, Response: ResponseField } = req.body;

//     if (!id || !ObjectId.isValid(id)) {
//       res.status(400).json({ error: 'Invalid or missing business ID' });
//       return;
//     }

//     const allowedValues = ['in-review', 'rejected', 'repost', 'approved', 'pending'];

//     const updateFields: any = {
//       updated_at: new Date(),
//       Title: Title,
//     };

//     if (Status !== undefined) {
//       if (!allowedValues.includes(Status)) {
//         res.status(400).json({ error: `Invalid Status value. Allowed values: ${allowedValues.join(', ')}` });
//         return;
//       }
//       updateFields.Status = Status;
//       updateFields.term = Status;
//     }

//     if (ResponseField !== undefined) {
//       updateFields.Response = ResponseField;
//     }

//     const businessCollection = await getCollection('business');

//     const result = await businessCollection.updateOne(
//       { _id: new ObjectId(id) },
//       { $set: updateFields }
//     );

//     if (result.matchedCount === 0) {
//       res.status(404).json({ message: 'Business not found' });
//       return;
//     }

//     res.status(200).json({ message: 'Business updated successfully' });
//   } catch (error) {
//     console.error('Error updating business:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };



export const updateBusinessStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, Title, Status, Response: ResponseField, expiry_at } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid or missing business ID' });
      return;
    }

    const allowedValues = ['in-review', 'rejected', 'repost', 'approved', 'pending'];

    const updateFields: any = {
      updated_at: new Date(),
      Title: Title,
    };

    let sendNotification = false;

    if (Status !== undefined) {
      if (!allowedValues.includes(Status)) {
        res.status(400).json({ error: `Invalid Status value. Allowed values: ${allowedValues.join(', ')}` });
        return;
      }

      updateFields.Status = Status;
      updateFields.term = Status;

      if (Status === 'approved') {
        updateFields.is_active = true;

        if (!expiry_at) {
          res.status(400).json({ error: 'expiry_at is required when approving the business' });
          return;
        }

        updateFields.expiry_at = new Date(expiry_at);
        sendNotification = true;
      }
    }

    if (ResponseField !== undefined) {
      updateFields.Response = ResponseField;
    }

    const businessCollection = await getCollection('business');
    const usersCollection = await getCollection('users');

    // Step 1: Fetch business document to get userId
    const businessDoc = await businessCollection.findOne({ _id: new ObjectId(id) });

    if (!businessDoc) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const userId = businessDoc.userId;

    // Step 2: Update business
    const result = await businessCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Step 3: Send push notification if approved
    if (sendNotification && userId) {
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (user?.device_token) {
        await push(
          user.device_token,
          'Spam Protection Activated',
          'Your spam protection is active now.'
        );
      }
    }

    res.status(200).json({ message: 'Business updated successfully' });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// export const updateBusinessStatus = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id, Title, Status, Response: ResponseField, expiry_at } = req.body;

//     if (!id || !ObjectId.isValid(id)) {
//       res.status(400).json({ error: 'Invalid or missing business ID' });
//       return;
//     }

//     const allowedValues = ['in-review', 'rejected', 'repost', 'approved', 'pending'];

//     const updateFields: any = {
//       updated_at: new Date(),
//       Title: Title,
//     };

//     if (Status !== undefined) {
//       if (!allowedValues.includes(Status)) {
//         res.status(400).json({ error: `Invalid Status value. Allowed values: ${allowedValues.join(', ')}` });
//         return;
//       }

//       updateFields.Status = Status;
//       updateFields.term = Status;

//       if (Status === 'approved') {
//         updateFields.is_active = true;

//         if (!expiry_at) {
//           res.status(400).json({ error: 'expiry_at is required when approving the business' });
//           return;
//         }

//         updateFields.expiry_at = new Date(expiry_at);
//       }
//     }

//     if (ResponseField !== undefined) {
//       updateFields.Response = ResponseField;
//     }

//     const businessCollection = await getCollection('business');

//     const result = await businessCollection.updateOne(
//       { _id: new ObjectId(id) },
//       { $set: updateFields }
//     );

//     if (result.matchedCount === 0) {
//       res.status(404).json({ message: 'Business not found' });
//       return;
//     }

//     res.status(200).json({ message: 'Business updated successfully' });
//   } catch (error) {
//     console.error('Error updating business:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };


export const getBusinessByTitle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { term } = req.query;

    if (!term) {
      res.status(400).json({ error: 'Title is required in query params' });
      return;
    }

    const inputTitle = String(term).toLowerCase();

    const businessCollection = await getCollection('business');

    const results = await businessCollection.find({
      term: inputTitle,
      is_payment: true
    }).toArray();

    res.status(200).json({ data: results });
  } catch (error) {
    console.error('Error fetching business data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// export const getBusinessByTitle = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { term } = req.query;

//     if (!term) {
//       res.status(400).json({ error: 'Title is required in query params' });
//       return;
//     }

//     // const allowedTitles = ['new', 'in-review', 'rejected', 'repost', 'approved'];
//     const inputTitle = String(term).toLowerCase();

//     // if (!allowedTitles.includes(inputTitle)) {
//     //   res.status(400).json({ error: `Invalid Title. Allowed values are: ${allowedTitles.join(', ')}` });
//     //   return;
//     // }

//     const businessCollection = await getCollection('business');

//     const results = await businessCollection.find({ term: inputTitle }).toArray();

//     res.status(200).json({ data: results });
//   } catch (error) {
//     console.error('Error fetching business data:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };