import dotenv from 'dotenv';
dotenv.config();
import cron from 'node-cron';
import { ObjectId } from 'mongodb';
import { getCollection } from '../config/database'; // Adjust path as needed
import { push } from '../services/sendPushNotification'; // adjust path
import axios from 'axios';

// Apple App Store credentials
const APPLE_SHARED_SECRET = "6f3d71bd51fb4700ac6b8d3ee6456a56";
const APPLE_VERIFY_URL = "https://sandbox.itunes.apple.com/verifyReceipt"; // Use https://buy.itunes.apple.com/verifyReceipt for production

// Cron job to run daily at 9:00 AM UTC (different from plan expiry job)
const appleReceiptVerificationJob = cron.schedule('0 9 * * *', async () => {
  console.log('Starting Apple receipt verification job at', new Date().toISOString());
  await checkAndVerifyAppleReceipts();
}, {
  timezone: "UTC"
});

// Main function to check and verify Apple receipts
const checkAndVerifyAppleReceipts = async () => {
  try {
    const aiPlansCollection = await getCollection("ai_plans");
    const usersCollection = await getCollection("users");
    
    console.log('Fetching plans with Apple receipt tokens...');
    
    // Find all plans that have token field (Apple receipt data) and non-empty values
    const plansWithTokens = await aiPlansCollection.find({
      token: { $exists: true, $nin: ["", null]},
      transaction_id: { $exists: true, $nin: ["", null] }
    }).toArray();
    
    console.log(`Found ${plansWithTokens.length} plans with Apple receipt tokens`);
    
    for (const plan of plansWithTokens) {
      try {
        // Check if we should verify this receipt (don't check if more than 2 days until expiry)
        if (shouldSkipVerification(plan)) {
          console.log(`Skipping verification for plan ${plan._id} - more than 2 days until expiry`);
          continue;
        }
        
        console.log(`Verifying Apple receipt for plan ${plan._id}, transaction_id: ${plan.transaction_id}`);
        
        // Verify receipt with Apple
        const verificationResult = await verifyAppleReceipt(plan.token, plan.transaction_id);
        
        if (verificationResult.success) {
          const newExpiryDate = verificationResult.expiryDate;
          const oldExpiryDate = plan.expiry_date;
          
          console.log(`Receipt verification successful for plan ${plan._id}`);
          console.log(`Old expiry: ${oldExpiryDate}, New expiry: ${newExpiryDate}`);
          
          // Update expiry date in the plan
          await aiPlansCollection.findOneAndUpdate(
            { _id: plan._id },
            {
              $set: {
                expiry_date: newExpiryDate,
                last_apple_verification: new Date(),
                apple_verification_status: 'success'
              }
            }
          );
          
          console.log(`Updated expiry date for plan ${plan._id} to ${newExpiryDate}`);
          
          // If expiry date was extended, send a success notification
          if (newExpiryDate && oldExpiryDate && new Date(newExpiryDate) > new Date(oldExpiryDate)) {
            await sendReceiptVerificationNotification(plan, 'success', newExpiryDate);
          }
          
        } else {
          console.log(`Receipt verification failed for plan ${plan._id}: ${verificationResult.error}`);
          
          // Update verification status
          await aiPlansCollection.findOneAndUpdate(
            { _id: plan._id },
            {
              $set: {
                last_apple_verification: new Date(),
                apple_verification_status: 'failed',
                apple_verification_error: verificationResult.error
              }
            }
          );
          
          // Check if plan is expired and send recharge notification
          const currentDate = new Date();
          const expiryDate = new Date(plan.expiry_date);
          
          if (expiryDate <= currentDate) {
            console.log(`Plan ${plan._id} is expired and receipt verification failed - sending recharge notification`);
            await sendReceiptVerificationNotification(plan, 'recharge_needed');
          }
        }
        
      } catch (error) {
        console.error(`Error processing Apple receipt for plan ${plan._id}:`, error);
        
        // Update error status
        await aiPlansCollection.findOneAndUpdate(
          { _id: plan._id },
          {
            $set: {
              last_apple_verification: new Date(),
              apple_verification_status: 'error',
              apple_verification_error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        );
      }
    }
    
    console.log('Apple receipt verification job completed');
    
  } catch (error) {
    console.error('Error in Apple receipt verification job:', error);
  }
};

// Function to check if we should skip verification (more than 2 days until expiry)
const shouldSkipVerification = (plan: any): boolean => {
  if (!plan.expiry_date) {
    return false; // Verify if no expiry date
  }
  
  const currentDate = new Date();
  const expiryDate = new Date(plan.expiry_date);
  const timeDiff = expiryDate.getTime() - currentDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  // Skip if more than 2 days until expiry
  return daysDiff > 2;
};

// Function to verify Apple receipt and find matching transaction
const verifyAppleReceipt = async (receiptData: string, transactionId: string): Promise<{
  success: boolean;
  expiryDate?: Date;
  error?: string;
  transactionFound?: boolean;
}> => {
  try {
    const requestBody = {
      "password": APPLE_SHARED_SECRET,
      "receipt-data": receiptData,
      "exclude-old-transactions": true
    };
    
    console.log('Sending verification request to Apple...');
    
    const response = await axios.post(APPLE_VERIFY_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    if (response.status === 200) {
      const responseData = response.data;
      console.log('Apple verification response status:', responseData.status);
      
      // Check if verification was successful
      if (responseData.status === 0) {
        // Receipt is valid, now search for transaction_id in receipt.in_app
        const receipt = responseData.receipt;
        
        if (receipt && receipt.in_app && Array.isArray(receipt.in_app)) {
          console.log(`Searching for transaction_id: ${transactionId} in ${receipt.in_app.length} transactions`);
          
          // Find matching transaction
          const matchingTransaction = receipt.in_app.find(
            (transaction: any) => transaction.transaction_id === transactionId
          );
          
          if (matchingTransaction) {
            console.log('Found matching transaction:', matchingTransaction.transaction_id);
            
            // Extract expiry date
            let expiryDate: Date;
            if (matchingTransaction.expires_date_ms) {
              // For subscriptions, use expires_date_ms
              expiryDate = new Date(parseInt(matchingTransaction.expires_date_ms));
            } else if (matchingTransaction.expires_date) {
              // Fallback to expires_date if available
              expiryDate = new Date(matchingTransaction.expires_date);
            } else {
              // If no expiry date, assume 30 days from purchase date
              const purchaseDate = matchingTransaction.purchase_date_ms ? 
                new Date(parseInt(matchingTransaction.purchase_date_ms)) : 
                new Date();
              expiryDate = new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000));
            }
            
            return {
              success: true,
              expiryDate: expiryDate,
              transactionFound: true
            };
          } else {
            console.log(`Transaction ID ${transactionId} not found in receipt`);
            return {
              success: false,
              error: `Transaction ID ${transactionId} not found in receipt`,
              transactionFound: false
            };
          }
        } else {
          return {
            success: false,
            error: 'No in_app transactions found in receipt',
            transactionFound: false
          };
        }
      } else {
        // Receipt verification failed
        const errorMessage = getAppleStatusMessage(responseData.status);
        return {
          success: false,
          error: `Apple verification failed: ${errorMessage} (Status: ${responseData.status})`,
          transactionFound: false
        };
      }
    } else {
      return {
        success: false,
        error: `HTTP Error: ${response.status}`,
        transactionFound: false
      };
    }
    
  } catch (error) {
    console.error('Error verifying Apple receipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during verification',
      transactionFound: false
    };
  }
};

// Function to get human-readable Apple status messages
const getAppleStatusMessage = (status: number): string => {
  const statusMessages: { [key: number]: string } = {
    0: 'Receipt is valid',
    21000: 'The App Store could not read the JSON object you provided',
    21002: 'The data in the receipt-data property was malformed or missing',
    21003: 'The receipt could not be authenticated',
    21004: 'The shared secret you provided does not match the shared secret on file',
    21005: 'The receipt server is not currently available',
    21006: 'This receipt is valid but the subscription has expired',
    21007: 'This receipt is from the sandbox environment',
    21008: 'This receipt is from the production environment',
    21010: 'This receipt could not be authorized'
  };
  
  return statusMessages[status] || `Unknown status code: ${status}`;
};

// Function to send notification based on verification result
const sendReceiptVerificationNotification = async (
  plan: any, 
  type: 'success' | 'recharge_needed', 
  newExpiryDate?: Date
) => {
  try {
    const usersCollection = await getCollection("users");
    const user = await usersCollection.findOne({ _id: plan.user_id });
    
    if (!user) {
      console.warn(`User not found for plan ${plan._id}`);
      return;
    }
    
    let title = '';
    let message = '';
    
    if (type === 'success') {
      title = 'Plan Renewed Successfully';
      const expiryDateStr = newExpiryDate ? newExpiryDate.toLocaleDateString() : 'updated';
      message = `Great news! Your ${plan.plan_detail?.plan || 'subscription'} plan has been renewed and is now active until ${expiryDateStr}.`;
    } else if (type === 'recharge_needed') {
      title = 'Plan Recharge Required';
      message = `Your ${plan.plan_detail?.plan || 'subscription'} plan has expired. Please recharge your plan to continue using our services.`;
    }
    
    // Send push notification if user has device token (FCM token)
    if (user.device_token) {
      console.log(`Sending Apple verification notification to ${user.phone}`);
      await push(user.device_token, title, message);
    } else {
      console.warn(`No device token found for user ${user.phone}`);
    }
    
    // Store notification record
    await storeAppleNotificationRecord(user._id, title, message, type, plan._id);
    
    console.log(`Sent Apple verification notification to user ${user.phone}: ${type}`);
    
  } catch (error) {
    console.error(`Error sending Apple verification notification for plan ${plan._id}:`, error);
  }
};

// Function to store Apple notification record
const storeAppleNotificationRecord = async (
  userId: any, 
  title: string, 
  message: string, 
  type: string,
  planId: any
) => {
  try {
    const notificationsCollection = await getCollection("apple_notifications");
    
    await notificationsCollection.insertOne({
      user_id: userId,
      plan_id: planId,
      title: title,
      message: message,
      notification_type: type,
      source: 'apple_receipt_verification',
      sent_at: new Date(),
      created_at: new Date()
    });
    
  } catch (error) {
    console.error('Error storing Apple notification record:', error);
  }
};

// Function to start the Apple receipt verification cron job
const startAppleReceiptVerificationJob = () => {
  console.log('Starting Apple receipt verification cron job');
  console.log('Scheduled to run daily at 9:00 AM UTC');
  appleReceiptVerificationJob.start();
};

// Function to stop the cron job
const stopAppleReceiptVerificationJob = () => {
  console.log('Stopping Apple receipt verification cron job');
  appleReceiptVerificationJob.stop();
};

// Function to run the job immediately (for testing)
const runAppleReceiptVerificationJobNow = async () => {
  console.log('Running Apple receipt verification job immediately for testing...');
  await checkAndVerifyAppleReceipts();
};

// Function to verify a specific plan's receipt (for manual testing)
const verifySpecificPlanReceipt = async (planId: string) => {
  try {
    const aiPlansCollection = await getCollection("ai_plans");
    const plan = await aiPlansCollection.findOne({ _id: new ObjectId(planId) });
    
    if (!plan) {
      console.log(`Plan ${planId} not found`);
      return;
    }
    
    if (!plan.token || !plan.transaction_id) {
      console.log(`Plan ${planId} has no Apple receipt token or transaction_id`);
      return;
    }
    
    console.log(`Verifying receipt for plan ${planId}...`);
    const result = await verifyAppleReceipt(plan.token, plan.transaction_id);
    console.log('Verification result:', result);
    
    return result;
    
  } catch (error) {
    console.error(`Error verifying specific plan receipt:`, error);
  }
};

export { 
  startAppleReceiptVerificationJob, 
  stopAppleReceiptVerificationJob, 
  runAppleReceiptVerificationJobNow,
  checkAndVerifyAppleReceipts,
  verifySpecificPlanReceipt
};