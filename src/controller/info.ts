import { Request, Response } from 'express';
import { connectToDatabase } from '../config/database';
import Term from '../models/Terms';
import Privacy from '../models/Privacy';

export const enterContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body;

    if (!title) {
      res.status(400).json({
        success: false,
        message: "Title is required"
      });
      return;
    }

    const db = await connectToDatabase();
    const contactCollection = db.collection("contactus");

    const result = await contactCollection.insertOne({ title });

    res.status(201).json({
      success: true,
      message: "Contact us entry created successfully",
      data: result
    });
  } catch (error) {
    console.error("Error creating contact entry:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

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

export const enterTerm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === "") {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const db = await connectToDatabase();
    const result = await db.collection("termconditions").insertOne({
      title: title.trim(),
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Term created successfully",
      data: result
    });
  } catch (error) {
    console.error("Error creating term:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getTerm = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await connectToDatabase();
    const terms = await db.collection("termconditions").find().sort({ createdAt: -1 }).toArray();

    if (terms.length === 0) {
      res.status(404).json({ success: false, message: "No terms found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Terms fetched successfully",
      data: terms
    });
  } catch (error) {
    console.error("Error fetching terms:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const enterPrivacy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === "") {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    const db = await connectToDatabase();
    const result = await db.collection("privacy").insertOne({
      title: title.trim(),
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Privacy entry created successfully",
      data: result
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
      data: privacies
    });
  } catch (error) {
    console.error("Error fetching privacy entries:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

