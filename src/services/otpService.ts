
import twilio from 'twilio';
import config from '../config/dotenv';

type OtpData = {
  otp: string;
  expiresAt: Date;
};

const otpStore: Map<string, OtpData> = new Map();

const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

export const sendOtp = async (phoneNumber: string, otp: string): Promise<void> => {
  const expiresAt = new Date(Date.now() + 1 * 60 * 1000);
  otpStore.set(phoneNumber, { otp, expiresAt });

  await client.messages.create({
    body: `Your OTP is ${otp}. It is valid for 1 minutes.`,
    from: config.twilioPhoneNumber,
    to: phoneNumber,
  });
};

/**
 * Verifies the OTP for a given phone number.
 */
export const verifyOtp = (phoneNumber: string, otp: string): boolean => {
  const otpData = otpStore.get(phoneNumber);

  if (!otpData) return false; // No OTP exists for the phone number
  if (new Date() > otpData.expiresAt) {
    otpStore.delete(phoneNumber); // Delete expired OTP
    return false; // OTP expired
  }

  if (otpData.otp === otp) {
    otpStore.delete(phoneNumber); // Delete OTP after successful verification
    return true; // OTP is valid
  }

  return false; // OTP is invalid
};
