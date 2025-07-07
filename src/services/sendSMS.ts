// utils/sendSms.ts or services/sendSms.ts

import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

const client = twilio(accountSid, authToken);

/**
 * Sends an SMS using Twilio.
 * @param to The recipient's phone number (in E.164 format, e.g., +919999999999)
 * @param message The message content to send
 */
export const sendSms = async (to: string, message: string): Promise<void> => {
  try {
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });

    console.log(`✅ SMS sent successfully to ${to} | SID: ${response.sid}`);
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${to}:`, error);
    throw error;
  }
};
