// server.ts
import express from 'express';
import dotenv from 'dotenv';
import { getAllUsers, blockUser, unblockUser, getBlockedUsers } from '../controller/admin.controller';

dotenv.config();

const router = express.Router();
// Routes
router.get('/api/users', getAllUsers);
router.post('/api/users/block', blockUser);
router.post('/api/users/unblock', unblockUser);
router.get('/api/users/blocked', getBlockedUsers);


export default router;