import { Request, Response } from 'express';
import { connectToDatabase } from '../config/database';
import { ObjectId } from "mongodb";

export const enterContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body;

    if (!title) {
      res.status(400).json({
        success: false,
        message: "Title is required",
      });
      return;
    }

    const db = await connectToDatabase();
    const contactCollection = db.collection("contactus");

    const result = await contactCollection.insertOne({
      title,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Contact us entry created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating contact entry:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get contact(s)
export const getContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await connectToDatabase();
    const contactCollection = db.collection("contactus");

    const contacts = await contactCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    if (!contacts || contacts.length === 0) {
      res.status(404).json({
        success: false,
        message: "No contact found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Contact us entries fetched successfully",
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching contact entries:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { title } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid or missing ID" });
      return;
    }

    if (!title || title.trim() === "") {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const db = await connectToDatabase();
    const contactCollection = db.collection("contactus");

    const result = await contactCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: title.trim(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({ success: false, message: "Contact entry not found or not modified" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Contact entry updated successfully",
    });
  } catch (error) {
    console.error("Error updating contact entry:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid or missing ID" });
      return;
    }

    const db = await connectToDatabase();
    const contactCollection = db.collection("contactus");

    const result = await contactCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: "Contact entry not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Contact entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact entry:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const enterTerm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { heading, title } = req.body;

    if (!title || title.trim() === '') {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    const db = await connectToDatabase();
    const result = await db.collection('termconditions').insertOne({
      heading: heading?.trim() || '',
      title: title.trim(),
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Term created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating term:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getTerm = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await connectToDatabase();
    const terms = await db
      .collection('termconditions')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    if (terms.length === 0) {
      res.status(404).json({ success: false, message: 'No terms found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Terms fetched successfully',
      data: terms
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const enterPrivacy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { heading, title } = req.body;

    if (!title || title.trim() === "") {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const db = await connectToDatabase();
    const result = await db.collection("privacy").insertOne({
      heading: heading || '',
      title: title.trim(),
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Privacy entry created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating privacy entry:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getPrivacy = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await connectToDatabase();
    const privacies = await db.collection("privacy").find().sort({ createdAt: -1 }).toArray();

    if (privacies.length === 0) {
      res.status(404).json({ success: false, message: "No privacy entries found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Privacy entries fetched successfully",
      data: privacies,
    });
  } catch (error) {
    console.error("Error fetching privacy entries:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updatePrivacy = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { title } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid or missing ID" });
      return;
    }

    if (!title || title.trim() === "") {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const db = await connectToDatabase();
    const result = await db.collection("privacy").updateOne(
      { _id: new ObjectId(id) },
      { $set: { title: title.trim(), updatedAt: new Date() } }
    );

if (result.modifiedCount === 0) {
      res.status(404).json({ success: false, message: "Privacy entry not found or not modified" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Privacy entry updated successfully",
    });
  } catch (error) {
    console.error("Error updating privacy entry:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

    
export const deletePrivacy = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid or missing ID" });
      return;
    }

    const db = await connectToDatabase();
    const result = await db.collection("privacy").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: "Privacy entry not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Privacy entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting privacy entry:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};