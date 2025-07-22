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

export const getDefaultVal = async (req: Request, res: Response) : Promise<void> => {
  try {
    const collection = await getCollection("default_val");

    // Fetch the first document (only one should exist)
    const document = await collection.findOne({});

    if (!document) {
       res.status(404).json({ message: "No configuration found" });
    }

    res.status(200).json(document);
  } catch (error: any) {
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
