import cron from 'node-cron';
import { getCollection } from '../config/database'; // Adjust path as needed
import { push } from '../services/sendPushNotification'; // adjust path


const planExpiryNotificationJob = cron.schedule('0 8 * * *', async () => {
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
        
        if (daysDiff > 0 && daysDiff <= 7) {
          // Plan expires in 1-7 days
          shouldSendNotification = true;
          notificationTitle = 'Plan Expiry Alert';
          
          if (daysDiff === 1) {
            notificationMessage = `Your ${plan.plan_detail.plan} plan will expire tomorrow! Please recharge to avoid service interruption.`;
          } else {
            notificationMessage = `Your ${plan.plan_detail.plan} plan will expire in ${daysDiff} days. Please recharge to continue using our services.`;
          }
          
        } else if (daysDiff <= 0) {
          // Plan has expired
          shouldSendNotification = true;
          shouldUpdateCallLimit = true;
          notificationTitle = 'Plan Expired';
          
          if (daysDiff === 0) {
            notificationMessage = `Your ${plan.plan_detail.plan} plan has expired today! Please recharge immediately to restore your services.`;
          } else {
            const expiredDays = Math.abs(daysDiff);
            notificationMessage = `Your ${plan.plan_detail.plan} plan expired ${expiredDays} ${expiredDays === 1 ? 'day' : 'days'} ago! Please recharge immediately to restore your services.`;
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
    
    // Send SMS if SMS is enabled for the user
    // For expiry notifications, we might want to send regardless of sms_type
    if (user.sms === true && user.contact) {
    //   console.log(`Sending expiry SMS to ${user.contact}`);
      
      // Create a more concise SMS message
      let smsMessage = '';
      if (daysLeft > 0) {
        smsMessage = `${user.phone.slice(-4)} plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Recharge now to avoid interruption.`;
      } else {
        const expiredDays = Math.abs(daysLeft);
        if (expiredDays === 0) {
          smsMessage = `${user.phone.slice(-4)} plan expired today! Recharge immediately.`;
        } else {
          smsMessage = `${user.phone.slice(-4)} plan expired ${expiredDays} day${expiredDays === 1 ? '' : 's'} ago! Recharge now.`;
        }
      }
      
    //   await sendSms(user.contact, smsMessage);
    } else {
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
    
    await notificationsCollection.insertOne({
      user_id: userId,
      title: title,
      message: message,
      days_left: daysLeft,
      notification_type: 'plan_expiry',
      sent_at: new Date(),
      created_at: new Date()
    });
    
  } catch (error) {
    console.error('💥 Error storing notification record:', error);
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