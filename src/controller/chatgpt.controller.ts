import { Request, Response } from 'express';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const chatGPTHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        // Check if API key is configured
        if (!OPENAI_API_KEY) {
            res.status(500).json({
                success: false,
                error: 'OpenAI API key is not configured'
            });
            return;
        }

        // Get the payload from request body
        const payload = req.body;

        // Validate that payload exists
        if (!payload || Object.keys(payload).length === 0) {
            res.status(400).json({
                success: false,
                error: 'Payload is required in the request body'
            });
            return;
        }

        // Forward the payload directly to OpenAI API
        const response = await axios.post(
            OPENAI_API_URL,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Return the response from ChatGPT
        res.status(200).json({
            success: true,
            data: response.data
        });

    } catch (error: any) {
        console.error('Error calling ChatGPT API:', error?.response?.data || error.message);

        // Handle different error types
        if (error.response) {
            // OpenAI API returned an error
            res.status(error.response.status).json({
                success: false,
                error: error.response.data || 'Error from OpenAI API',
                status: error.response.status
            });
        } else if (error.request) {
            // Request was made but no response received
            res.status(500).json({
                success: false,
                error: 'No response received from OpenAI API'
            });
        } else {
            // Error setting up the request
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }
};

