import { Request, Response } from 'express';
import { getCollection } from '../config/database'; // assume helper to get MongoDB collection



// export const blockUser = async (req: Request, res: Response): Promise<void> => {
//   const { phone } = req.body;
//   if (!phone) {
//     res.status(400).json({ message: "Phone is required" });
//     return;
//   }

//   try {
//     const blockCollection = await getCollection("block");
//     const usersCollection = await getCollection("users");

//     // Check if already in VIP
//     const existing = await blockCollection.findOne({ phone });
//     if (existing) {
//       res.status(409).json({ message: "Phone already in blocked list" });
//       return;
//     }

//     // Insert into VIP list
//     await blockCollection.insertOne({ phone });

//     // Update user if found
//     const user = await usersCollection.findOne({ phone });
//     if (user) {
//       await usersCollection.updateOne(
//         { _id: user._id },
//         { $set: { is_blocked: true } }
//       );
//     }

//     res.status(201).json({ message: "Phone added to blocked list" });
//   } catch (err) {
//     res.status(500).json({ message: "Error adding phone", error: err });
//   }
// };

export const blockUser = async (req: Request, res: Response): Promise<void> => {
  const { phone, email } = req.body;

  if (!phone && !email) {
    res.status(400).json({ message: "Phone or Email is required" });
    return;
  }

  try {
    const blockCollection = await getCollection("block");
    const usersCollection = await getCollection("users");

    // For phone blocking
    if (phone) {
      const existing = await blockCollection.findOne({ phone });
      if (existing) {
        res.status(409).json({ message: "Phone already in blocked list" });
        return;
      }

      await blockCollection.insertOne({ phone });

      const user = await usersCollection.findOne({ phone });
      if (user) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { is_blocked: true } }
        );
      }

      res.status(201).json({ message: "Phone added to blocked list" });
      return;
    }

    // For email blocking
    if (email) {
      const existing = await blockCollection.findOne({ email });
      if (existing) {
        res.status(409).json({ message: "Email already in blocked list" });
        return;
      }

      await blockCollection.insertOne({ email });

      const user = await usersCollection.findOne({ "user.email": email });
      if (user) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { is_blocked: true } }
        );
      }

      res.status(201).json({ message: "Email added to blocked list" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error adding to blocked list", error: err });
  }
};


export const getBlocks = async (_req: Request, res: Response) => {
  try {
    const blockCollection = await getCollection("block");
    const usersCollection = await getCollection("users");

    const blocked = await blockCollection.find().toArray();

    // Check if data exists
    if (!blocked || blocked.length === 0) {
      res.json([]);
      return;
    }

    // For each blocked item, check if phone exists and get user data
    const blockedWithUserData = await Promise.all(
      blocked.map(async (blockItem) => {
        let userData = null;

        // Check if phone exists in block item
        if (blockItem.phone) {
          // Find user by phone in usersCollection
          const user = await usersCollection.findOne({ phone: blockItem.phone });
          userData = user?.user || null;
        }

        return {
          ...blockItem,
          userData: userData || null
        };
      })
    );

    res.json(blockedWithUserData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching blocked list", error: err });
  }
};


export const deleteBlock = async (req: Request, res: Response): Promise<void> => {
  const { phone, email } = req.params;

  if (!phone && !email) {
    res.status(400).json({ message: "Phone or Email is required in params" });
    return;
  }

  try {
    const blockCollection = await getCollection("block");
    const usersCollection = await getCollection("users");

    let result;

    if (phone) {
      // Unset is_blocked from users collection
      const user = await usersCollection.findOne({ phone });
      if (user && user.is_blocked) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $unset: { is_blocked: "" } }
        );
      }

      // Delete from block collection
      result = await blockCollection.deleteOne({ phone });

      if (result.deletedCount === 0) {
        res.status(404).json({ message: "Phone not found in Block list" });
        return;
      }

      res.json({ message: "Phone removed from Block list" });
      return;
    }

    if (email) {
      // Unset is_blocked from users collection
      const user = await usersCollection.findOne({ "user.email": email });
      if (user && user.is_blocked) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $unset: { is_blocked: "" } }
        );
      }

      // Delete from block collection
      result = await blockCollection.deleteOne({ email });

      if (result.deletedCount === 0) {
        res.status(404).json({ message: "Email not found in Block list" });
        return;
      }

      res.json({ message: "Email removed from Block list" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error deleting from Block list", error: err });
  }
};

// export const deleteBlock = async (req: Request, res: Response): Promise<void> => {
//   const { phone } = req.params;

//   try {
//     const blockCollection = await getCollection("block");
//     const usersCollection = await getCollection("users");

//     // Remove `is_blocked` field from user if present
//     const user = await usersCollection.findOne({ phone });
//     if (user && user.is_blocked) {
//       await usersCollection.updateOne(
//         { _id: user._id },
//         { $unset: { is_blocked: "" } }
//       );
//     }

//     // Then delete from block collection
//     const result = await blockCollection.deleteOne({ phone });

//     if (result.deletedCount === 0) {
//       res.status(404).json({ message: "Phone not found in Block list" });
//       return;
//     }

//     res.json({ message: "Phone removed from Block list" });
//   } catch (err) {
//     res.status(500).json({ message: "Error deleting phone", error: err });
//   }
// };
