import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'otp_db';

let client: MongoClient;

export const connectToDatabase = async () => {
    try {
        if (!client) {
            client = new MongoClient(MONGODB_URI);
            await client.connect();
            console.log('Connected to MongoDB successfully');
        }
        return client.db(DB_NAME);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
};

export const getCollection = async (collectionName: string) => {
    const db = await connectToDatabase();
    return db.collection(collectionName);
};

export const closeDatabaseConnection = async () => {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
}; 