import { Request, Response } from "express";
import { getCollection } from "../config/database"; // adjust path to where you put connectToDatabase.ts

export const createOrUpdateDefaultPrompt = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { prompt } = req.body;

    const title = "AI";

    if (!title || !prompt) {
      return res.status(400).json({ message: "Title and prompt are required" });
    }

    const collection = await getCollection("defaultprompt");

    const result = await collection.updateOne(
      { title }, // find document by title
      {
        $set: {
          title,
          prompt,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    res.status(200).json({
      message: result.upsertedCount > 0 ? "Prompt inserted successfully" : "Prompt updated successfully",
      result,
    });
  } catch (error: any) {
    console.error("Error saving prompt:", error);
    res.status(500).json({
      message: "Error saving prompt",
      error: error.message,
    });
  }
};


// ✅ Get all prompts
export const getAllDefaultPrompts = async (req: Request, res: Response) => {
  try {
    const collection = await getCollection("defaultprompt");
    const prompts = await collection.find().toArray();

    res.status(200).json(prompts);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching prompts", error: error.message });
  }
};
export const getAllglobalPrompts = async (req: Request, res: Response) => {
  try {
    const collection = await getCollection("globalprompt");
    const prompts = await collection.find().toArray();

    res.status(200).json(prompts);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching prompts", error: error.message });
  }
};



import { ObjectId } from "mongodb";

export const addOrUpdateUserPrompt = async (req: Request, res: Response) : Promise<any> => {
  try {
    const { userId, prompt } = req.body;

    if (!userId || !prompt) {
      return res.status(400).json({ message: "userId and prompt are required" });
    }

    const collection = await getCollection("users");

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) }, // match by userId (_id in users collection)
      {
        $set: {
          prompt,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: false } // don't create a new user, only update existing
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: result.modifiedCount > 0 ? "Prompt updated successfully" : "Prompt already up to date",
      result,
    });
  } catch (error: any) {
    console.error("Error updating user prompt:", error);
    res.status(500).json({ message: "Error updating user prompt", error: error.message });
  }
};




export const createOrUpdateGlobalPrompt = async (req: Request, res: Response): Promise<any> => {
  try {
    const { prompt } = req.body;

    const title = "AI"; // fixed title like your defaultPrompt example

    if (!title || !prompt) {
      return res.status(400).json({ message: "Title and prompt are required" });
    }

    const collection = await getCollection("globalprompt");

    const result = await collection.updateOne(
      { title }, // find document by title
      {
        $set: {
          title,
          prompt,
          new: true, // 👈 mark this save as new
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    res.status(200).json({
      message: result.upsertedCount > 0 ? "Global prompt inserted successfully" : "Global prompt updated successfully",
      result,
    });
  } catch (error: any) {
    console.error("Error saving global prompt:", error);
    res.status(500).json({
      message: "Error saving global prompt",
      error: error.message,
    });
  }
};
