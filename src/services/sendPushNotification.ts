// utils/sendPushNotification.ts

import admin from '../config/firebase';

/**
 * Sends an FCM push notification to a single device.
 * @param deviceToken FCM device token
 * @param title Notification title
 * @param body Notification message
 */
export const push = async (
  deviceToken: string,
  title: string,
  body: string
): Promise<void> => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      token: deviceToken,
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Push notification sent successfully. FCM ID: ${response}`);
  } catch (error) {
    console.error(`❌ Failed to send push notification:`, error);
    throw error;
  }
};
