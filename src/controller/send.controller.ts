import { Request, Response, NextFunction } from "express";
import twilio from "twilio";

// Replace with your actual Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID ;
const authToken = process.env.TWILIO_AUTH_TOKEN ;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER ;

const client = twilio(accountSid, authToken);

export const sendSmsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone_num, message } = req.body;

    if (
      !phone_num ||
      typeof phone_num !== "string" ||
      !message ||
      typeof message !== "string"
    ) {
      res.status(400).json({ error: "Valid phone_num and message are required" });
      return;
    }

    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phone_num,
    });

    res.status(200).json({
      success: true,
      message: "SMS sent successfully",
      sid: result.sid,
    });
  } catch (error) {
    next(error);
  }
};
