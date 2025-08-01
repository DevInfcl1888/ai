import { Request, Response } from "express";
import { getCollection } from "../config/database";
import { DefaultVal } from "../models/defaultVals";

export const saveDefaultVal = async (req: Request, res: Response) => {
  try {
    const data: DefaultVal = req.body;
    const collection = await getCollection("default_val");

    // Replace existing document or insert if none exists
    const result = await collection.replaceOne({}, data, { upsert: true });

    res.status(201).json({
      message: "Document saved successfully",
      acknowledged: result.acknowledged,
      upsertedId: result.upsertedId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// export const getDefaultVal = async (req: Request, res: Response) : Promise<void> => {
//   try {
//     const collection = await getCollection("default_val");

//     // Fetch the first document (only one should exist)
//     const document = await collection.findOne({});

//     if (!document) {
//        res.status(404).json({ message: "No configuration found" });
//     }

//     res.status(200).json(document);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// };

import dotenv from 'dotenv';

dotenv.config();

import Retell from 'retell-sdk';
const client = new Retell({
  apiKey: process.env.RETELL_API_KEY || '',
});
// const client = new Retell({
//   apiKey: 'YOUR_RETELL_API_KEY',
// });

// export const getDefaultVal = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const collection = await getCollection("default_val");

//     // Fetch the first document (only one should exist)
//     const document = await collection.findOne({});

//     if (!document) {
//       res.status(404).json({ message: "No configuration found" });
//       return;
//     }

//     // Fetch knowledge base data from Retell API
//     try {
//       const knowledgeBaseResponses: any = await client.knowledgeBase.list();
//       // console.log('Knowledge Base Responses:', knowledgeBaseResponses);

//       // Extract knowledge base IDs and add them to the document
//       // Check the actual structure of the response and extract IDs accordingly
//       let knowledgeBaseIds: string[] = [];
      
//       if (Array.isArray(knowledgeBaseResponses)) {
//         // If response is directly an array
//         knowledgeBaseIds = knowledgeBaseResponses.map((kb: any) => kb.knowledge_base_id || kb.id).filter(Boolean);
//       } else if (knowledgeBaseResponses.data && Array.isArray(knowledgeBaseResponses.data)) {
//         // If response has a 'data' property with array
//         knowledgeBaseIds = knowledgeBaseResponses.data.map((kb: any) => kb.knowledge_base_id || kb.id).filter(Boolean);
//       } else if (knowledgeBaseResponses.knowledge_bases && Array.isArray(knowledgeBaseResponses.knowledge_bases)) {
//         // If response has a 'knowledge_bases' property with array
//         knowledgeBaseIds = knowledgeBaseResponses.knowledge_bases.map((kb: any) => kb.knowledge_base_id || kb.id).filter(Boolean);
//       } else {
//         // Try to extract from any array property in the response
//         const responseObj = knowledgeBaseResponses as any;
//         for (const key in responseObj) {
//           if (Array.isArray(responseObj[key])) {
//             knowledgeBaseIds = responseObj[key].map((kb: any) => kb.knowledge_base_id || kb.id).filter(Boolean);
//             break;
//           }
//         }
//       }
      
//       // Update the document with knowledge base IDs
//       const updatedDocument = {
//         ...document,
//         knowledge_base_ids: knowledgeBaseResponses
//       };

//       res.status(200).json(updatedDocument);
//     } catch (retellError: any) {
//       console.error('Error fetching knowledge base data:', retellError);
      
//       // If Retell API fails, still return the original document
//       res.status(200).json({
//         ...document,
//         knowledge_base_ids: [], // Keep empty array if API fails
//         retell_error: `Failed to fetch knowledge base: ${retellError.message}`
//       });
//     }

//   } catch (error: any) {
//     console.error('Database error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
export const getDefaultVal = async (req: Request, res: Response): Promise<void> => {
  try {
    const collection = await getCollection("default_val");

    // Fetch the first document (only one should exist)
    const document = await collection.findOne({});

    if (!document) {
      res.status(404).json({ message: "No configuration found" });
      return;
    }

    // Fetch knowledge base data from Retell API
    try {
      const knowledgeBaseResponses: any = await client.knowledgeBase.list();

      // Extract knowledge base IDs from Retell response
      let knowledgeBaseList: any[] = [];

      if (Array.isArray(knowledgeBaseResponses)) {
        knowledgeBaseList = knowledgeBaseResponses;
      } else if (knowledgeBaseResponses?.data && Array.isArray(knowledgeBaseResponses.data)) {
        knowledgeBaseList = knowledgeBaseResponses.data;
      } else if (knowledgeBaseResponses?.knowledge_bases && Array.isArray(knowledgeBaseResponses.knowledge_bases)) {
        knowledgeBaseList = knowledgeBaseResponses.knowledge_bases;
      } else {
        // Try to extract from any array property
        for (const key in knowledgeBaseResponses) {
          if (Array.isArray(knowledgeBaseResponses[key])) {
            knowledgeBaseList = knowledgeBaseResponses[key];
            break;
          }
        }
      }

      const availableKBIds = knowledgeBaseList.map((kb: any) => kb.knowledge_base_id || kb.id).filter(Boolean);

      // Filter only matching IDs from the document
      const filteredKnowledgeBaseIds = (document.knowledge_base_ids || []).filter((id: string) =>
        availableKBIds.includes(id)
      );

      const updatedDocument = {
        ...document,
        knowledge_base_ids: filteredKnowledgeBaseIds
      };

      res.status(200).json(updatedDocument);
    } catch (retellError: any) {
      console.error('Error fetching knowledge base data:', retellError);

      // Still return the original document but with empty knowledge_base_ids
      res.status(200).json({
        ...document,
        knowledge_base_ids: [], 
        retell_error: `Failed to fetch knowledge base: ${retellError.message}`
      });
    }

  } catch (error: any) {
    console.error('Database error:', error);
    res.status(500).json({ error: error.message });
  }
};

import { ObjectId } from "mongodb";


export const saveAiDataToUser = async (req: Request, res: Response) : Promise<void> => {
  try {
    const userId = req.params.userId;
    const aiData: DefaultVal = req.body;

    if (!ObjectId.isValid(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
    }

    const usersCollection = await getCollection("users");

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { ai_data: aiData } }
    );

    if (result.matchedCount === 0) {
       res.status(404).json({ message: "User not found" });
       return;
    }

    res.status(200).json({ message: "AI data saved to user successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};




// src/routes/globalValueRoutes.ts
// export const saveGlobalValue = async (req: Request, res: Response) : Promise<void> => {
//   try {
//     const data = req.body;

//     if (!("version" in data)) {
//        res.status(400).json({ error: "version field is required" });
//        return
//     }

//     const globalValueCollection = await getCollection("global_value");
//     const usersCollection = await getCollection("users");

//     // Check if version exists in global_value
//     const existing = await globalValueCollection.findOne({ version: data.version });

//     if (existing) {
//       // Update the document
//       await globalValueCollection.updateOne({ version: data.version }, { $set: data });
//     } else {
//       // Insert new document
//       await globalValueCollection.insertOne(data);
//     }

//     // Update all users where ai_data.version == data.version or ai_data is missing
//     const updateResult = await usersCollection.updateMany(
//       { $or: [{ "ai_data.version": data.version }, { "ai_data": { $exists: false } }] },
//       { $set: { ai_data: data } }
//     );

//      res.status(200).json({
//       message: "Saved successfully",
//       updated_documents: updateResult.modifiedCount
//     });
//     return

//   } catch (error) {
//     console.error("Error saving global value:", error);
//      res.status(500).json({ error: "Internal Server Error" });
//      return
//   }
// };


export const saveGlobalValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;

    if (!("version" in data)) {
      res.status(400).json({ error: "version field is required" });
      return;
    }

    const globalValueCollection = await getCollection("global_value");
    const usersCollection = await getCollection("users");

    // Check if version exists in global_value
    const existing = await globalValueCollection.findOne({ version: data.version });

    if (existing) {
      // Update the document
      await globalValueCollection.updateOne({ version: data.version }, { $set: data });
    } else {
      // Insert new document
      await globalValueCollection.insertOne(data);
    }

    // Update users where ai_data.version matches the new version (strict match only)
    const updateResult = await usersCollection.updateMany(
      { "ai_data.version": data.version },
      { $set: { ai_data: data } }
    );

    res.status(200).json({
      message: "Saved successfully",
      updated_documents: updateResult.modifiedCount
    });
  } catch (error) {
    console.error("Error saving global value:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// export const updateAIData = async (req: Request, res: Response) : Promise<void> => {
//   try {
//     const { userId, version, ai_data } = req.body;

//     if (!userId || typeof version !== 'number' || !ai_data) {
//        res.status(400).json({ error: "Missing userId, version, or ai_data" });
//        return;
//     }

//     const usersCollection = await getCollection("users");

//     const result = await usersCollection.updateOne(
//       { _id: new ObjectId(userId), "ai_data.version": version },
//       {
//         $set: {
//           "ai_data": {
//             ...ai_data,
//             version: version + 1 // increment version
//           },
//           updatedAt: new Date()
//         }
//       }
//     );

//     if (result.matchedCount === 0) {
//        res.status(409).json({ success: false, message: "Version mismatch or user not found" });
//        return
//     }

//      res.status(200).json({ success: true, message: "ai_data updated" });
//      return
//   } catch (error) {
//     console.error("Error updating ai_data:", error);
//      res.status(500).json({ error: "Internal Server Error" });
//      return
//   }
// };

export const updateAIData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, ai_data } = req.body;

    if (!userId || !ai_data) {
      res.status(400).json({ error: "Missing userId or ai_data" });
      return;
    }

    const usersCollection = await getCollection("users");

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ai_data,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, message: "ai_data updated successfully" });
  } catch (error) {
    console.error("Error updating ai_data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



export const getAllGlobalData = async (req: Request, res: Response) : Promise<void> => {
  try {
    const globalValueCollection = await getCollection("global_value");
    const allData = await globalValueCollection.find({}).toArray();

     res.status(200).json({
      message: "Global data fetched successfully.",
      count: allData.length,
      data: allData
    });
    return;

  } catch (error) {
    console.error("Error fetching global data:", error);
     res.status(500).json({ message: "Internal Server Error", error });
     return;
  }
};




export const addPrice = async (req: Request, res: Response) : Promise<void> => {
  try {
    const { price, time } = req.body;

    if (price === undefined || time === undefined) {
       res.status(400).json({ message: "price and time are required" });
    }

    const priceCollection = await getCollection("price");

    // Delete all existing documents (keep only one)
    const deleteResult = await priceCollection.deleteMany({});

    // Insert the new document
    const insertResult = await priceCollection.insertOne({ price, time });

     res.status(200).json({
      message: "Price saved successfully",
      deletedCount: deleteResult.deletedCount,
      insertedId: insertResult.insertedId,
    });

  } catch (error) {
    console.error("Error in addPrice:", error);
     res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getPrice = async (req: Request, res: Response) : Promise<void> => {
  try {
    const priceCollection = await getCollection("price");

    const data = await priceCollection.findOne({});
    if (!data) {
       res.status(404).json({ message: "No price found" });
    }

     res.status(200).json({
      message: "Price fetched successfully",
      data,
    });

  } catch (error) {
    console.error("Error in getPrice:", error);
     res.status(500).json({ message: "Internal Server Error", error });
  }
};



export const getAllBusinesses = async (req: Request, res: Response): Promise<void> => {
  try {
    const businessCollection = await getCollection("business");
    const businesses = await businessCollection.find({}).toArray();

    res.status(200).json({
      success: true,
      data: businesses,
      count: businesses.length,
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
