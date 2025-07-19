import dotenv from 'dotenv';
dotenv.config();
import Retell from 'retell-sdk';

let retellClient: Retell | null = null;

if (process.env.RETELL_API_KEY) {
  retellClient = new Retell({
    apiKey: process.env.RETELL_API_KEY,
  });
} else {
  console.warn('RETELL_API_KEY is not set - Retell operations will be skipped');
}
import cron from 'node-cron';
import { ObjectId } from 'mongodb';
import { getCollection } from '../config/database'; // Adjust path as needed
import { push } from '../services/sendPushNotification'; // adjust path

const planExpiryNotificationJob = cron.schedule('* * * * *', async () => {
  console.log('Starting plan expiry notification job at', new Date().toISOString());
  await checkAndNotifyPlanExpiry();
}, {
//   scheduled: false, // Don't start immediately
  timezone: "UTC"
});

// Function to check plan expiry and send notifications
const checkAndNotifyPlanExpiry = async () => {
  try {
    const aiPlansCollection = await getCollection("ai_plans");
    const usersCollection = await getCollection("users");
    
    // Get current date at UTC 8:00 AM
    const currentDate = new Date();
    // console.log(`Current UTC Date: ${currentDate.toISOString()}`);
    
    // Find all active plans
    const activePlans = await aiPlansCollection.find({
      expiry_date: { $exists: true }
    }).toArray();
    
    // console.log(`Found ${activePlans.length} plans to check`);
    
    for (const plan of activePlans) {
      try {
        const expiryDate = new Date(plan.expiry_date);
        const timeDiff = expiryDate.getTime() - currentDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        // console.log(`Plan ${plan._id}: Expires in ${daysDiff} days`);
        
        // Find the user for this plan
        const user = await usersCollection.findOne({ _id: plan.user_id });
        
        if (!user) {
          console.warn(`User not found for plan ${plan._id}`);
          continue;
        }
        
        let shouldSendNotification = false;
        let notificationTitle = '';
        let notificationMessage = '';
        let shouldUpdateCallLimit = false;
        let shouldDeleteAccount = false;
        
        if (daysDiff > 0 && daysDiff <= 7) {
          // Plan expires in 1-7 days
          shouldSendNotification = true;
          notificationTitle = 'Plan Expiry Alert';
          
          if (daysDiff === 1) {
            notificationMessage = `Your ${plan.plan_detail.plan} plan will expire tomorrow! Please recharge to avoid service interruption.`;
          } else {
            notificationMessage = `Your ${plan.plan_detail.plan} plan will expire in ${daysDiff} days. Please recharge to continue using our services.`;
          }
          
        } else if (daysDiff <= 0 && daysDiff > -28) {
          // Plan has expired but less than 28 days
          shouldSendNotification = true;
          shouldUpdateCallLimit = true;
          notificationTitle = 'Plan Expired';
          
          if (daysDiff === 0) {
            notificationMessage = `Your ${plan.plan_detail.plan} plan has expired today! Please recharge immediately to restore your services.`;
          } else {
            const expiredDays = Math.abs(daysDiff);
            notificationMessage = `Your ${plan.plan_detail.plan} plan expired ${expiredDays} ${expiredDays === 1 ? 'day' : 'days'} ago! Please recharge immediately to restore your services.`;
          }
          
        } else if (daysDiff <= -28 && daysDiff > -30) {
          // Plan expired 28-29 days ago - send deletion warning
          shouldSendNotification = true;
          shouldUpdateCallLimit = true;
          notificationTitle = 'Account Deletion Warning';
          
          const expiredDays = Math.abs(daysDiff);
          notificationMessage = `⚠️ URGENT: Your ${plan.plan_detail.plan} plan expired ${expiredDays} days ago. Your account and AI number will be permanently deleted in ${30 - expiredDays} ${30 - expiredDays === 1 ? 'day' : 'days'} if not recharged!`;
          
        } else if (daysDiff <= -30) {
          // Plan expired 30+ days ago - delete account
          shouldDeleteAccount = true;
          console.log(`Plan ${plan._id} expired ${Math.abs(daysDiff)} days ago. Proceeding with account deletion for user ${user.phone}`);
        }
        
        // Handle account deletion for plans expired 30+ days
        if (shouldDeleteAccount) {
          try {
            await deleteUserAccount(user, plan);
            console.log(`Successfully deleted account for user ${user.phone} (Plan expired ${Math.abs(daysDiff)} days ago)`);
            continue; // Skip to next plan as user is deleted
          } catch (error) {
            console.error(`Failed to delete account for user ${user.phone}:`, error);
          }
        }
        
        // Handle call limit reset for expired plans
        if (shouldUpdateCallLimit) {
          const currentCallLimit = plan.plan_detail?.call_limit;
          
          // Check if call_limit exists and is a positive integer
          if (currentCallLimit && 
              typeof currentCallLimit === 'number' && 
              Number.isInteger(currentCallLimit) && 
              currentCallLimit > 0) {
            
            // console.log(`Resetting call_limit for expired plan ${plan._id}: ${currentCallLimit} -> 0`);
            
            // Update the call_limit to 0 in the plan_detail
            await aiPlansCollection.findOneAndUpdate(
              { _id: plan._id },
              {
                $set: {
                  "plan_detail.call_limit": 0,
                  call_limit_reset_at: new Date()
                }
              }
            );
            
            // console.log(`Call limit reset to 0 for plan ${plan._id}`);
          } else if (currentCallLimit && currentCallLimit < 0) {
            // console.log(`Skipping call_limit reset for plan ${plan._id}: already negative (${currentCallLimit})`);
          } else if (currentCallLimit === 0) {
            // console.log(`Skipping call_limit reset for plan ${plan._id}: already 0`);
          } else {
            // console.log(`No valid call_limit found for plan ${plan._id}: ${currentCallLimit}`);
          }
        }
        
        if (shouldSendNotification) {
          await sendExpiryNotifications(user, notificationTitle, notificationMessage, daysDiff);
          
          // Log the notification
        //   console.log(`Sent expiry notification to user ${user.phone} (${user.ai_number}): ${daysDiff} days`);
          
          // Update plan with last notification info
          await aiPlansCollection.findOneAndUpdate(
            { _id: plan._id },
            {
              $set: {
                last_expiry_notification: new Date(),
                last_expiry_notification_days: daysDiff
              }
            }
          );
        }
        
      } catch (error) {
        console.error(`Error processing plan ${plan._id}:`, error);
      }
    }
    
    // console.log('Plan expiry notification job completed');
    
  } catch (error) {
    console.error('Error in plan expiry notification job:', error);
  }
};

// Function to delete user account (extracted from deleteAccountHandler)
const deleteUserAccount = async (user: any, plan: any) => {
  const usersCollection = await getCollection("users");
  const aiPlansCollection = await getCollection("ai_plans");
  const userDoc = await usersCollection.findOne({ _id: new ObjectId(user._id) });

  if (!userDoc) {
    // res.status(404).json({ error: "User not found" });
    console.log("User not found");
    return;
  }
  try {
    // Track deletion results
    const deletionResults = {
      phoneNumber: false,
      agent: false,
      llm: false,
      plan: false,
      user: false
    };

    // Delete Retell phone number if exists
        // Delete Retell phone number if exists
    if (userDoc.ai_number && retellClient) {
    try {
        await retellClient.phoneNumber.delete(userDoc.ai_number);
        deletionResults.phoneNumber = true;
        console.log("Deleted phone number from Retell:", userDoc.ai_number);
    } catch (error) {
        console.error("Error deleting phone number from Retell:", error);
    }
    } else if (userDoc.ai_number && !retellClient) {
    console.warn("Retell client not available - skipping phone number deletion");
    }

    // Delete Retell user if exists
    // Delete Retell agent if exists
    if (userDoc.agent_id && retellClient) {
      try {
        await retellClient.agent.delete(userDoc.agent_id);
        deletionResults.agent = true;
        console.log("Deleted agent from Retell:", userDoc.agent_id);
      } catch (error) {
        console.error("Error deleting agent from Retell:", error);
        // Continue with deletion process even if agent deletion fails
      }
    }

    // Delete Retell LLM if exists
    if (userDoc.llm_id && retellClient) {
      try {
        await retellClient.llm.delete(userDoc.llm_id);
        deletionResults.llm = true;
        console.log("Deleted LLM from Retell:", userDoc.llm_id);
      } catch (error) {
        console.error("Error deleting LLM from Retell:", error);
        // Continue with deletion process even if LLM deletion fails
      }
    }

    // Delete the plan from ai_plans collection
    const planDeleteResult = await aiPlansCollection.deleteOne({ _id: plan._id });
    deletionResults.plan = planDeleteResult.deletedCount > 0;
    console.log("Deleted plan:", plan._id, "Result:", planDeleteResult.deletedCount);

    // Delete user from database
    const deleteResult = await usersCollection.deleteOne({ _id: user._id });
    deletionResults.user = deleteResult.deletedCount > 0;
    console.log("Deleted user from database:", user.phone, "Result:", deleteResult.deletedCount);

    if (deleteResult.deletedCount === 0) {
      throw new Error("Failed to delete user from database");
    }

    // Log successful deletion
    console.log("Account deletion completed successfully:", {
      userId: user._id,
      phone: user.phone,
      aiNumber: user.ai_number,
      deletionResults
    });

    // Store deletion record for audit purposes
    await storeDeletionRecord(user, plan, deletionResults);

    return deletionResults;

  } catch (error) {
    console.error("Error during automated account deletion:", error);
    throw error;
  }
};

// Function to send expiry notifications to user
const sendExpiryNotifications = async (user: any, title: string, message: string, daysLeft: number) => {
  try {
    // Send push notification if user has device token
    if (user.device_token) {
    //   console.log(`Sending push notification to ${user.phone}`);
      await push(user.device_token, title, message);
    } else {
      console.warn(`No device token found for user ${user.phone}`);
    }
    
    // Send SMS for all expiry notifications (including deletion warnings)
    // For critical notifications (28+ days expired), send SMS regardless of user preference
    const isCriticalNotification = daysLeft <= -28;
    
    if ((user.sms === true && user.contact) || (isCriticalNotification && user.contact)) {
    //   console.log(`Sending expiry SMS to ${user.contact}`);
      
      // Create a more concise SMS message
      let smsMessage = '';
      if (daysLeft > 0) {
        smsMessage = `${user.phone.slice(-4)} plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Recharge now to avoid interruption.`;
      } else if (daysLeft > -28) {
        const expiredDays = Math.abs(daysLeft);
        if (expiredDays === 0) {
          smsMessage = `${user.phone.slice(-4)} plan expired today! Recharge immediately.`;
        } else {
          smsMessage = `${user.phone.slice(-4)} plan expired ${expiredDays} day${expiredDays === 1 ? '' : 's'} ago! Recharge now.`;
        }
      } else {
        // Critical deletion warning SMS
        const expiredDays = Math.abs(daysLeft);
        const daysUntilDeletion = Math.max(0, 30 - expiredDays);
        smsMessage = `🚨 URGENT: ${user.phone.slice(-4)} account will be DELETED in ${daysUntilDeletion} day${daysUntilDeletion === 1 ? '' : 's'}! Recharge immediately to save your AI number.`;
      }
      
    //   await sendSms(user.contact, smsMessage);
    } else if (!isCriticalNotification) {
      console.log(`SMS not enabled or no contact for user ${user.phone}`);
    }
    
    // Optional: Store notification in database for tracking
    await storeNotificationRecord(user._id, title, message, daysLeft);
    
  } catch (error) {
    console.error(`Error sending expiry notifications to user ${user.phone}:`, error);
  }
};

// Function to store notification record (optional)
const storeNotificationRecord = async (userId: any, title: string, message: string, daysLeft: number) => {
  try {
    const notificationsCollection = await getCollection("expiry_notifications");
    
    let notificationType = 'plan_expiry';
    if (daysLeft <= -28) {
      notificationType = 'deletion_warning';
    } else if (daysLeft <= 0) {
      notificationType = 'plan_expired';
    } else if (daysLeft <= 7) {
      notificationType = 'expiry_warning';
    }
    
    await notificationsCollection.insertOne({
      user_id: userId,
      title: title,
      message: message,
      days_left: daysLeft,
      notification_type: notificationType,
      sent_at: new Date(),
      created_at: new Date()
    });
    
  } catch (error) {
    console.error('💥 Error storing notification record:', error);
  }
};

// Function to store deletion record for audit purposes
const storeDeletionRecord = async (user: any, plan: any, deletionResults: any) => {
  try {
    const deletionLogsCollection = await getCollection("deletion_logs");
    
    await deletionLogsCollection.insertOne({
      user_id: user._id,
      phone: user.phone,
      ai_number: user.ai_number,
      agent_id: user.agent_id,
      llm_id: user.llm_id,
      plan_id: plan._id,
      plan_name: plan.plan_detail?.plan,
      expiry_date: plan.expiry_date,
      deletion_reason: 'auto_expired_30_days',
      deletion_results: deletionResults,
      deleted_at: new Date(),
      created_at: new Date()
    });
    
    console.log(`Deletion record stored for user ${user.phone}`);
    
  } catch (error) {
    console.error('Error storing deletion record:', error);
  }
};

// Function to start the cron job
const startPlanExpiryJob = () => {
//   console.log('Starting plan expiry notification cron job');
//   console.log('Scheduled to run daily at 8:00 AM UTC');
  planExpiryNotificationJob.start();
};

// Function to stop the cron job
const stopPlanExpiryJob = () => {
//   console.log('Stopping plan expiry notification cron job');
  planExpiryNotificationJob.stop();
};

// Function to run the job immediately (for testing)
const runPlanExpiryJobNow = async () => {
//   console.log('Running plan expiry job immediately for testing...');
  await checkAndNotifyPlanExpiry();
};

export { 
  startPlanExpiryJob, 
  stopPlanExpiryJob, 
  runPlanExpiryJobNow,
  checkAndNotifyPlanExpiry 
};