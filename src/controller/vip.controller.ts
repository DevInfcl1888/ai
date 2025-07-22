import { Request, Response } from 'express';
import { getCollection } from '../config/database'; // assume helper to get MongoDB collection

// Add phone to VIP
export const addVIP = async (req: Request, res: Response) : Promise<void> => {
  const { phone } = req.body;
  if (!phone) {
     res.status(400).json({ message: "Phone is required" });
  }

  try {
    const vipCollection = await getCollection("vip");

    // Optional: Check if already exists
    const existing = await vipCollection.findOne({ phone });
    if (existing) {
       res.status(409).json({ message: "Phone already in VIP list" });
    }

    await vipCollection.insertOne({ phone });
    res.status(201).json({ message: "Phone added to VIP list" });
  } catch (err) {
    res.status(500).json({ message: "Error adding phone", error: err });
  }
};

// Get all VIP phones
export const getVIPs = async (_req: Request, res: Response) => {
  try {
    const vipCollection = await getCollection("vip");
    const vips = await vipCollection.find().toArray();
    res.json(vips);
  } catch (err) {
    res.status(500).json({ message: "Error fetching VIP list", error: err });
  }
};

// Delete phone from VIP
export const deleteVIP = async (req: Request, res: Response) : Promise<void> => {
  const { phone } = req.params;

  try {
    const vipCollection = await getCollection("vip");
    const result = await vipCollection.deleteOne({ phone });

    if (result.deletedCount === 0) {
       res.status(404).json({ message: "Phone not found in VIP list" });
    }

    res.json({ message: "Phone removed from VIP list" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting phone", error: err });
  }
};
