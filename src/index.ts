import express from 'express';
import { sendOtpHandler, verifyOTPhandler } from './routes/otpRoute';
import { connectToDatabase, closeDatabaseConnection } from './config/database';
import dotenv from 'dotenv';
import { editProfileHandler, getProfileHandler, loginHandler } from './routes/loginRoute';
import { socialLoginHandler, socialRegisterHandler } from './routes/socialRoute';

dotenv.config();

const app = express();
app.use(express.json());


connectToDatabase()
    .then(() => {
        console.log('MongoDB connection established');
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    });

// Routes
app.post('/otp/send', sendOtpHandler);
app.post('/otp/verify', verifyOTPhandler);
app.post('/login', loginHandler);
app.post('/social/register', socialRegisterHandler);
app.post('/social/login', socialLoginHandler);
app.put('/edit-profile', editProfileHandler);
app.get('/get-profile', getProfileHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing HTTP server and MongoDB connection...');
    server.close(async () => {
        await closeDatabaseConnection();
        process.exit(0);
    });
});
