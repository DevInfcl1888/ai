import express from "express";
import {startPlanExpiryJob} from "./cron/plan.cron";
// Type definitions for Retell AI webhook
interface RetellCallData {
  call_id: string;
  from_number?: string;
  to_number?: string;
  call_status: string;
  end_reason: string;
  duration: number;
  [key: string]: any;
}

interface RetellWebhookPayload {
  event: string;
  data: RetellCallData;
}

interface NotificationData {
  title: string;
  body: string;
  type: string;
}
import { sendOtpHandler, verifyOTPhandler } from "./routes/otpRoute";
import {
  saveUserPlanHandler,
  getLatestUserPlanHandler,
  savePlansDataHandler,
  updatePlan,
  getAllPlansHandler,
  deletePlanByIdHandler,
  saveTermsHandler,
  editTermsByIdHandler,
  deleteTermsByIdHandler,
  getTermsHandler,
} from "./controller/admin.controller";
import { connectToDatabase, closeDatabaseConnection } from "./config/database";
import dotenv from "dotenv";
import {
  editProfileHandler,
  getProfileHandler,
  loginHandler,
  updateUserPreferencesHandler,
} from "./routes/loginRoute";
import {
  socialLoginHandler,
  socialRegisterHandler,
  deleteAccountHandler,
  checkUserPhone,
  addPhoneBySocialId
} from "./routes/socialRoute";
import router from "./routes/admin.route";

import { sendSmsHandler } from "./controller/send.controller";
import {createBusiness, getBusinessByUserId, updateBusinessById, updateBusinessPaymentById, updateBusinessStatus,getBusinessByTitle} from "./controller/business.controller";
import {saveDefaultVal, getDefaultVal, saveAiDataToUser, saveGlobalValue, updateAIData, getAllGlobalData, addPrice, getPrice, getAllBusinesses} from "./controller/defaultVal.controller";

//Info
import {
    enterContact,
    getContact,
    updateContact,
    deleteContact,
    enterTerm,
    getTerm,
    updateTerm,
    deleteTerm,
    enterPrivacy,
    getPrivacy,
    updatePrivacy,
    deletePrivacy
} from "./controller/info"  
dotenv.config();
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));


connectToDatabase()
  .then(() => {
    console.log("MongoDB connection established");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });

import cors from "cors"; 

// Allow specific origin (your frontend dev server)
app.use(
  cors({
    origin: "*", // or "*" to allow all origins temporarily
    credentials: true, // if you are using cookies
  })
);







import { getCollection } from './config/database'; // Adjust path as needed
import { sendSms } from './services/sendSMS'; // adjust path
import { push } from './services/sendPushNotification'; // adjust path


// Store active calls with their start times and intervals
const activeCalls = new Map<string, {
  startTime: Date;
  toNumber: string;
  intervalId: NodeJS.Timeout;
  currentDuration: number;
}>();


// Function to start live duration tracking
const startLiveDurationTracking = (callId: string, toNumber: string) => {
  const startTime = new Date();
  
  const intervalId = setInterval(() => {
    const currentTime = new Date();
    const durationMs = currentTime.getTime() - startTime.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);
    const durationMinutes = Math.floor(durationSeconds / 60);
    const remainingSeconds = durationSeconds % 60;
    
    // Update current duration
    if (activeCalls.has(callId)) {
      activeCalls.get(callId)!.currentDuration = durationSeconds;
    }
    
    console.log(`⏱️ LIVE - Call ${callId} (${toNumber}): ${durationMinutes}:${remainingSeconds.toString().padStart(2, '0')} (${durationSeconds}s)`);
    
    // Optional: Update database with live duration every 10 seconds to avoid too many writes
    if (durationSeconds % 10 === 0) {
      updateLiveCallDuration(callId, toNumber, durationSeconds);
      
      // Deduct seconds from user's plan every 10 seconds during live call
      deductSecondsFromPlan(toNumber, 10);
    }
  }, 2000); // Every 2 seconds
  
  // Store the active call info
  activeCalls.set(callId, {
    startTime,
    toNumber,
    intervalId,
    currentDuration: 0
  });
  
  console.log(`🚀 Started live duration tracking for call ${callId} (${toNumber})`);
};


// Function to stop live duration tracking
const stopLiveDurationTracking = (callId: string) => {
  const callInfo = activeCalls.get(callId);
  if (callInfo) {
    clearInterval(callInfo.intervalId);
    activeCalls.delete(callId);
    console.log(`⏹️ Stopped live duration tracking for call ${callId}`);
    return callInfo.currentDuration;
  }
  return 0;
};


// Function to update live call duration in database
const updateLiveCallDuration = async (callId: string, toNumber: string, durationSeconds: number) => {
  try {
    const liveCallsCollection = await getCollection("live_calls");
    await liveCallsCollection.findOneAndUpdate(
      { call_id: callId },
      { 
        $set: {
          current_duration_seconds: durationSeconds,
          last_updated: new Date()
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("💥 Error updating live call duration:", error);
  }
};


// Function to deduct seconds from user's plan
// const deductSecondsFromPlan = async (toNumber: string, secondsToDeduct: number) => {
//   try {
//     const usersCollection = await getCollection("users");
//     const aiPlansCollection = await getCollection("ai_plans");
    
//     // Find user by ai_number
//     const user = await usersCollection.findOne({ ai_number: toNumber });
    
//     if (!user) {
//       console.warn(`⚠️ User with ai_number ${toNumber} not found. Skipping plan deduction.`);
//       return;
//     }
    
//     // Find user's active plan
//     const userPlan = await aiPlansCollection.findOne({ user_id: user._id });
    
//     if (!userPlan) {
//       console.warn(`⚠️ No active plan found for user ${user._id}. Skipping plan deduction.`);
//       return;
//     }
    
//     const currentCallLimit = userPlan.plan_detail.call_limit;
//     const newCallLimit = currentCallLimit - secondsToDeduct;
    
//     // Update the plan with new call_limit
//     await aiPlansCollection.findOneAndUpdate(
//       { user_id: user._id },
//       { 
//         $set: {
//           "plan_detail.call_limit": newCallLimit
//         }
//       }
//     );
    
//     console.log(`💰 Deducted ${secondsToDeduct} seconds from user ${toNumber}. New limit: ${newCallLimit} seconds`);
    
//     // Check for low balance and send notifications
//     await checkAndSendLowBalanceNotification(user, newCallLimit);
    
//   } catch (error) {
//     console.error("💥 Error deducting seconds from plan:", error);
//   }
// };

// Function to deduct seconds from user's plan
const deductSecondsFromPlan = async (toNumber: string, secondsToDeduct: number) => {
  try {
    const usersCollection = await getCollection("users");
    const aiPlansCollection = await getCollection("ai_plans");
    
    // Find user by ai_number
    const user = await usersCollection.findOne({ ai_number: toNumber });
    
    if (!user) {
      console.warn(`⚠️ User with ai_number ${toNumber} not found. Skipping plan deduction.`);
      return;
    }
    
    // Find user's active plan
    const userPlan = await aiPlansCollection.findOne({ user_id: user._id });
    
    if (!userPlan) {
      console.warn(`⚠️ No active plan found for user ${user._id}. Skipping plan deduction.`);
      return;
    }
    
    const currentCallLimit = userPlan.plan_detail.call_limit;
    
    // Check if user has already reached the minimum limit of -1800 seconds
    if (currentCallLimit <= -5400) {
      console.warn(`⚠️ User ${toNumber} has reached maximum overdraft limit (-1800 seconds). No further deductions will be made.`);
      return;
    }
    
    const newCallLimit = currentCallLimit - secondsToDeduct;
    
    // Ensure the new limit doesn't go below -1800
    const finalCallLimit = Math.max(newCallLimit, -5400);
    
    // Update the plan with new call_limit
    await aiPlansCollection.findOneAndUpdate(
      { user_id: user._id },
      { 
        $set: {
          "plan_detail.call_limit": finalCallLimit
        }
      }
    );
    
    console.log(`💰 Deducted ${secondsToDeduct} seconds from user ${toNumber}. New limit: ${finalCallLimit} seconds`);
    
    // If we hit the -1800 limit, log a special message
    if (finalCallLimit === -5400 && newCallLimit < -5400) {
      console.log(`🚫 User ${toNumber} has reached maximum overdraft limit of -1800 seconds. No further deductions will be made.`);
    }
    
    // Check for low balance and send notifications
    await checkAndSendLowBalanceNotification(user, finalCallLimit);
    
  } catch (error) {
    console.error("💥 Error deducting seconds from plan:", error);
  }
};
// Function to check and send low balance notifications
// const checkAndSendLowBalanceNotification = async (user: any, currentCallLimit: number) => {
//   try {
//     // Define threshold values (in seconds)
//     const thresholds = [10, 5, 0, -30, -60, -90, -1800]; // Added some negative thresholds for ongoing notifications
    
//     // Check if current limit hits any threshold
//     if (thresholds.includes(currentCallLimit) || currentCallLimit < 0) {
//       let message = '';
      
//       if (currentCallLimit > 0) {
//         const minutes = Math.floor(currentCallLimit / 60);
//         const seconds = currentCallLimit % 60;
//         message = `Low Balance Alert! You have ${minutes}:${seconds.toString().padStart(2, '0')} minutes remaining. Please Recharge.`;
//       } else {
//         const overdraftMinutes = Math.abs(Math.floor(currentCallLimit / 60));
//         const overdraftSeconds = Math.abs(currentCallLimit % 60);
//         message = `Balance Exhausted! You've used ${overdraftMinutes}:${overdraftSeconds.toString().padStart(2, '0')} minutes over your limit. Please Recharge immediately.`;
//       }
      
//       // Send push notification if user has device token
//       if (user.device_token) {
//         console.log("📱 Sending low balance notification to device token:", user.device_token);
//         await push(user.device_token, 'Balance Alert', message);
//       }
      
//       // Send SMS if SMS is enabled for the user
//       if (user.sms === true && user.contact) {
//         console.log("📩 Sending low balance SMS to", user.contact);
//         await sendSms(user.contact, message);
//       }
      
//       console.log(`🔔 Low balance notification sent for user ${user.ai_number}. Current limit: ${currentCallLimit} seconds`);
//     }
    
//   } catch (error) {
//     console.error("💥 Error sending low balance notification:", error);
//   }
// };

// Function to check and send low balance notifications
const checkAndSendLowBalanceNotification = async (user: any, currentCallLimit: number) => {
  try {
    // Define threshold values (in seconds)
    const thresholds = [10, 5, 0, -30, -60, -90, -1800]; // Added some negative thresholds for ongoing notifications
    
    // Check if current limit hits any threshold
    if (thresholds.includes(currentCallLimit) || currentCallLimit < 0) {
      let message = '';
      
      if (currentCallLimit > 0) {
        const minutes = Math.floor(currentCallLimit / 60);
        const seconds = currentCallLimit % 60;
        message = `Low Balance Alert! You have ${minutes}:${seconds.toString().padStart(2, '0')} minutes remaining. Please Recharge.`;
      } else {
        // For negative values, get absolute value for display
        const absoluteLimit = Math.abs(currentCallLimit);
        const overdraftMinutes = Math.floor(absoluteLimit / 60);
        const overdraftSeconds = absoluteLimit % 60;
        message = `Balance Exhausted! You've used ${overdraftMinutes}:${overdraftSeconds.toString().padStart(2, '0')} minutes over your limit. Please Recharge immediately.`;
      }
      
      // Send push notification if user has device token
      if (user.device_token) {
        console.log("📱 Sending low balance notification to device token:", user.device_token);
        await push(user.device_token, 'Balance Alert', message);
      }
      
      // Send SMS if SMS is enabled for the user
      if (user.sms === true && user.contact) {
        console.log("📩 Sending low balance SMS to", user.contact);
        await sendSms(user.contact, message);
      }
      
      console.log(`🔔 Low balance notification sent for user ${user.ai_number}. Current limit: ${currentCallLimit} seconds`);
    }
    
  } catch (error) {
    console.error("💥 Error sending low balance notification:", error);
  }
};


app.post("/retell-webhook", async (req, res) => {
  console.log("🔔 RETELL AI WEBHOOK ENDPOINT HIT!");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    const webhookData = req.body;
    const event = webhookData.event;
    const call = webhookData.call;
    const callId = call?.call_id;
    const toNumber = call?.to_number;

    if (event === "call_started") {
      console.log("📱 CALL STARTED EVENT DETECTED!");
      console.log(`🔔 Call ID: ${callId}`);
      console.log(`📞 To Number: ${toNumber}`);
      
      // Start live duration tracking
      if (callId && toNumber) {
        startLiveDurationTracking(callId, toNumber);
        
        // Store call start info in database
        try {
          const liveCallsCollection = await getCollection("live_calls");
          await liveCallsCollection.insertOne({
            call_id: callId,
            to_number: toNumber,
            start_time: new Date(),
            current_duration_seconds: 0,
            status: 'active',
            last_updated: new Date()
          });
        } catch (error) {
          console.error("💥 Error storing call start info:", error);
        }
      }

    } else if (event === "call_ended") {
      console.log("📞 CALL ENDED EVENT DETECTED!");
      
      // Extract call duration information
      const callId = call?.call_id;
      const toNumber = call?.to_number;
      const startTime = call?.start_timestamp;
      const endTime = call?.end_timestamp;
      
      // Stop live tracking and get final duration
      const liveTrackedDuration = stopLiveDurationTracking(callId);
      
      let callDurationSeconds = 0;
      let callDurationMinutes = 0;
      
      if (startTime && endTime) {
        const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
        callDurationSeconds = Math.round(duration / 1000);
        callDurationMinutes = Math.round(callDurationSeconds / 60);
      } else if (liveTrackedDuration > 0) {
        callDurationSeconds = liveTrackedDuration;
        callDurationMinutes = Math.round(callDurationSeconds / 60);
      }
      
      console.log(`⏱️ Final Call Duration: ${callDurationSeconds} seconds (${callDurationMinutes} minutes)`);
      
      // Store call duration in database and mark as ended
      await updateCallMinutes(toNumber, callDurationSeconds, callId);
      
      // Final deduction of any remaining seconds that weren't deducted during live tracking
      const remainingSeconds = callDurationSeconds % 10;
      if (remainingSeconds > 0) {
        await deductSecondsFromPlan(toNumber, remainingSeconds);
      }
      
      // Update live_calls collection to mark as ended
      try {
        const liveCallsCollection = await getCollection("live_calls");
        await liveCallsCollection.findOneAndUpdate(
          { call_id: callId },
          { 
            $set: {
              status: 'ended',
              final_duration_seconds: callDurationSeconds,
              final_duration_minutes: callDurationMinutes,
              end_time: new Date()
            }
          }
        );
      } catch (error) {
        console.error("💥 Error updating call end info:", error);
      }

    } else if (event === "call_analyzed") {
      console.log("📊 CALL ANALYZED EVENT DETECTED!");

      const callSummary = call?.call_analysis?.call_summary || "No summary";
      const userSentiment = call?.call_analysis?.user_sentiment || "Unknown";
      const toNumber = call?.to_number || "Unknown";
      const callId = call?.call_id;
      
      let callDurationSeconds = 0;
      let callDurationMinutes = 0;
      
      try {
        // First, try to get duration from the calls collection (most reliable)
        const callsCollection = await getCollection("calls");
        const existingCall = await callsCollection.findOne({ call_id: callId });
        
        if (existingCall && existingCall.duration_seconds) {
          callDurationSeconds = existingCall.duration_seconds;
          callDurationMinutes = existingCall.duration_minutes || Math.round(callDurationSeconds / 60);
          console.log(`⏱️ Call Duration from DB: ${callDurationSeconds} seconds (${callDurationMinutes} minutes)`);
        } else {
          // Fallback: try to get from live_calls collection
          const liveCallsCollection = await getCollection("live_calls");
          const liveCall = await liveCallsCollection.findOne({ call_id: callId });
          
          if (liveCall && liveCall.final_duration_seconds) {
            callDurationSeconds = liveCall.final_duration_seconds;
            callDurationMinutes = liveCall.final_duration_minutes || Math.round(callDurationSeconds / 60);
            console.log(`⏱️ Call Duration from live_calls: ${callDurationSeconds} seconds (${callDurationMinutes} minutes)`);
          } else {
            // Last resort: try timestamps (but this seems unreliable)
            const startTime = call?.start_timestamp;
            const endTime = call?.end_timestamp;
            
            if (startTime && endTime) {
              const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
              callDurationSeconds = Math.round(duration / 1000);
              callDurationMinutes = Math.round(duration / (1000 * 60));
              console.log(`⏱️ Call Duration from timestamps: ${callDurationSeconds} seconds (${callDurationMinutes} minutes)`);
            } else {
              console.warn("⚠️ No duration found for call", callId);
            }
          }
        }
      } catch (error) {
        console.error("💥 Error getting call duration:", error);
      }

      console.log("📄 Call Summary:", callSummary);
      console.log("💬 User Sentiment:", userSentiment);
      console.log("📞 To Number:", toNumber);

      // Call your custom function with duration
      await sendNotify({ 
        callSummary, 
        userSentiment, 
        toNumber, 
        callDurationSeconds: callDurationSeconds,
        callId 
      });

    } else {
      console.log("ℹ️ Non-call-ended event received:", event);
      
      // Handle other events but don't start tracking for them
      if (event !== "call_started") {
        const callId = call?.call_id;
        const activeCall = activeCalls.get(callId);
        if (activeCall) {
          const currentDurationSeconds = activeCall.currentDuration;
          const currentDurationMinutes = Math.floor(currentDurationSeconds / 60);
          console.log(`⏱️ Current call duration: ${currentDurationSeconds} seconds (${currentDurationMinutes} minutes)`);
        }
      }
    }

    res.status(200).json({ message: "Webhook received successfully" });
  } catch (error) {
    console.error("💥 ERROR processing Retell AI webhook:", error);
    console.error("Stack trace:", (error as Error).stack);
    res.status(500).json({ error: "Internal server error" });
  }
});


// API endpoint to get live call duration (now includes plan balance info)
app.get("/live-call-duration/:callId", async (req, res) => {
  const callId = req.params.callId;

  try {
    const activeCall = activeCalls.get(callId);

    if (activeCall) {
      const currentDuration = activeCall.currentDuration;
      const minutes = Math.floor(currentDuration / 60);
      const seconds = currentDuration % 60;
      
      // Get user's current plan balance
      const usersCollection = await getCollection("users");
      const aiPlansCollection = await getCollection("ai_plans");
      
      const user = await usersCollection.findOne({ ai_number: activeCall.toNumber });
      let planBalance = null;
      
      if (user) {
        const userPlan = await aiPlansCollection.findOne({ user_id: user._id });
        if (userPlan) {
          planBalance = {
            call_limit_seconds: userPlan.plan_detail.call_limit,
            call_limit_minutes: Math.floor(userPlan.plan_detail.call_limit / 60),
            plan_name: userPlan.plan_detail.plan
          };
        }
      }
      
      res.json({
        call_id: callId,
        to_number: activeCall.toNumber,
        duration_seconds: currentDuration,
        duration_formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        is_active: true,
        start_time: activeCall.startTime,
        plan_balance: planBalance
      });
    } else {
      // Check database for completed calls
      const liveCallsCollection = await getCollection("live_calls");
      const callRecord = await liveCallsCollection.findOne({ call_id: callId });
      
      if (callRecord) {
        res.json({
          call_id: callId,
          to_number: callRecord.to_number,
          duration_seconds: callRecord.current_duration_seconds || 0,
          duration_formatted: `${Math.floor((callRecord.current_duration_seconds || 0) / 60)}:${((callRecord.current_duration_seconds || 0) % 60).toString().padStart(2, '0')}`,
          is_active: callRecord.status === 'active',
          start_time: callRecord.start_time,
          end_time: callRecord.end_time || null
        });
      } else {
        res.status(404).json({ error: "Call not found" });
      }
    }
  } catch (error) {
    console.error("💥 Error getting live call duration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// API endpoint to get all active calls
app.get("/active-calls", async (req, res) => {
  try {
    const activeCallsArray = Array.from(activeCalls.entries()).map(([callId, callInfo]) => ({
      call_id: callId,
      to_number: callInfo.toNumber,
      duration_seconds: callInfo.currentDuration,
      duration_formatted: `${Math.floor(callInfo.currentDuration / 60)}:${(callInfo.currentDuration % 60).toString().padStart(2, '0')}`,
      start_time: callInfo.startTime
    }));

    res.json({
      active_calls: activeCallsArray,
      total_active: activeCallsArray.length
    });
  } catch (error) {
    console.error("💥 Error getting active calls:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// New function to update call minutes
const updateCallMinutes = async (toNumber: string, durationSeconds: number, callId: string) => {
  try {
    const usersCollection = await getCollection("users");
    const callsCollection = await getCollection("calls");

    // Check if user exists
    const user = await usersCollection.findOne({ ai_number: toNumber });

    if (!user) {
      console.warn(`⚠️ User with ai_number ${toNumber} not found. Skipping update.`);
      return;
    }

    const durationMinutes = Math.round(durationSeconds / 60);

    // Update user's total call stats
    await usersCollection.findOneAndUpdate(
      { ai_number: toNumber },
      { 
        $inc: { 
          total_call_seconds: durationSeconds,
          total_call_minutes: durationMinutes,
          call_count: 1 
        },
        $set: {
          last_call_duration_seconds: durationSeconds,
          last_call_duration_minutes: durationMinutes,
          last_call_timestamp: new Date()
        }
      }
    );

    // Insert individual call record
    await callsCollection.insertOne({
      call_id: callId,
      to_number: toNumber,
      duration_seconds: durationSeconds,
      duration_minutes: durationMinutes,
      timestamp: new Date(),
      created_at: new Date()
    });

    console.log(`📊 Updated call duration for ${toNumber}: ${durationSeconds} seconds (${durationMinutes} minutes)`);
  } catch (error) {
    console.error("💥 Error updating call minutes:", error);
  }
};


const sendNotify = async ({
  callSummary,
  userSentiment,
  toNumber,
  callDurationSeconds = 0,
  callId,
}: {
  callSummary: string;
  userSentiment: string;
  toNumber: string;
  callDurationSeconds?: number;
  callId?: string;
}) => {
  console.log("🚀 Sending notification:");
  console.log("Sentiment:", userSentiment);
  console.log("To:", toNumber);
  console.log("Duration:", callDurationSeconds, "seconds");

  // Map sentiment to message
  let sentimentMessage = '';
  const sentiment = userSentiment.toLowerCase();
  switch (sentiment) {
    case 'positive':
      sentimentMessage = 'Customer is interested';
      break;
    case 'neutral':
      sentimentMessage = 'Customer is Neutral';
      break;
    case 'negative':
      sentimentMessage = 'Customer is not interested';
      break;
    default:
      sentimentMessage = 'Customer sentiment is unknown';
  }

  const callDurationMinutes = Math.round(callDurationSeconds / 60);
  const finalMessage = `${sentimentMessage}`;
  const finalMess = `${sentimentMessage} \nCall Summary: ${callSummary}\nCall Duration: ${callDurationSeconds} seconds (${callDurationMinutes} minutes)`;

  try {
    const usersCollection = await getCollection("users");
    const callsCollection = await getCollection("calls");

    // Update user with call info and duration
    const user = await usersCollection.findOneAndUpdate(
      { ai_number: toNumber },
      { 
        $inc: { 
          call_count: 1,
          total_call_seconds: callDurationSeconds,
          total_call_minutes: callDurationMinutes 
        },
        $set: {
          last_call_duration_seconds: callDurationSeconds,
          last_call_duration_minutes: callDurationMinutes,
          last_call_timestamp: new Date(),
          last_call_sentiment: sentiment,
          last_call_summary: callSummary
        }
      },
      { returnDocument: 'after' }
    );

    if (!user) {
      console.log("No user found for number:", toNumber);
      return;
    }

    // Store detailed call record
    await callsCollection.insertOne({
      call_id: callId,
      user_id: user._id,
      to_number: toNumber,
      duration_seconds: callDurationSeconds,
      duration_minutes: callDurationMinutes,
      sentiment: sentiment,
      summary: callSummary,
      timestamp: new Date(),
      created_at: new Date()
    });

    const {
      sms,
      sms_type,
      notification,
      device_token,
      contact,
    } = user;

    const sentimentAllowList = ['positive', 'neutral'];

    // --- SMS check ---
    const smsType = sms_type?.toLowerCase();
    const canSendSMS =
      sms === true &&
      (
        smsType === 'always' ||
        (smsType === 'interested' && sentimentAllowList.includes(sentiment))
      );

    if (canSendSMS) {
      if (contact) {
        console.log("📩 Sending SMS to", contact);
        await sendSms(contact, finalMess);
      } else {
        console.warn("⚠️ No contact found. Cannot send SMS.");
      }
    } else {
      console.log("📵 SMS is disabled or not applicable for this sentiment.");
    }

    // --- Notification check ---
    const notifSetting = notification?.toLowerCase();
    const canSendNotif =
      notifSetting === 'always' ||
      (notifSetting === 'interested' && sentimentAllowList.includes(sentiment));

    if (canSendNotif) {
      if (device_token) {
        console.log("📱 Sending FCM push notification to device token:", device_token);
        await push(device_token, '📞 AI Call Result', finalMessage);
      } else {
        console.warn("⚠️ No device token found. Cannot send FCM notification.");
      }
    } else {
      console.log("🔕 Notifications are disabled or not applicable for this sentiment.");
    }

  } catch (error) {
    console.error("💥 Error in sendNotify:", error);
  }
};


const getUserCallStats = async (toNumber: string) => {
  try {
    const usersCollection = await getCollection("users");
    const callsCollection = await getCollection("calls");
    
    const user = await usersCollection.findOne({ ai_number: toNumber });
    if (!user) return null;

    const callHistory = await callsCollection.find({ to_number: toNumber })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    return {
      total_calls: user.call_count || 0,
      total_seconds: user.total_call_seconds || 0,
      total_minutes: user.total_call_minutes || 0,
      last_call_duration_seconds: user.last_call_duration_seconds || 0,
      last_call_duration_minutes: user.last_call_duration_minutes || 0,
      last_call_timestamp: user.last_call_timestamp,
      recent_calls: callHistory
    };
  } catch (error) {
    console.error("💥 Error getting call stats:", error);
    return null;
  }
};

app.post("/send-sms", sendSmsHandler);

// Routes
app.post("/otp/send", sendOtpHandler);
app.post("/otp/verify", verifyOTPhandler);
app.post("/login", loginHandler);
app.post("/checkPhone", checkUserPhone);
app.post("/addPhone", addPhoneBySocialId);
app.post("/social/register", socialRegisterHandler);
app.post("/notifyToggle", updateUserPreferencesHandler);
app.post("/social/login", socialLoginHandler);
app.put("/edit-profile", editProfileHandler);
app.get("/get-profile", getProfileHandler);
app.delete("/delete-account", deleteAccountHandler);
app.post("/plans", saveUserPlanHandler);
app.get("/getplansDetails", getLatestUserPlanHandler);
app.get("/getAllPlans", getAllPlansHandler);
app.post("/savePlan", savePlansDataHandler);
app.put("/update-plan/:id", updatePlan);
app.delete("/plan/:id", deletePlanByIdHandler);
app.post("/saveTerms", saveTermsHandler);
app.get("/getTerms", getTermsHandler);
app.put("/editTerms/:id", editTermsByIdHandler);
app.delete("/deleteTerms/:id", deleteTermsByIdHandler);
app.post("/add-contact",enterContact);
app.get("/get-contact",getContact);
app.put("/edit-contact/:id",updateContact);
app.delete("/delete-contact/:id",deleteContact);
app.post("/add-term",enterTerm);
app.get("/get-term",getTerm);
app.put("/update-term/:id",updateTerm);
app.delete("/delete-term/:id",deleteTerm);
app.post("/add-privacy",enterPrivacy);
app.get("/get-privacy",getPrivacy);
app.put("/edit-privacy/:id",updatePrivacy);
app.delete("/delete-privacy/:id",deletePrivacy);
app.post("/createBusiness",createBusiness);
app.get("/getAllBusinesses", getAllBusinesses);
app.get("/getBusinessByUserId/:userId",getBusinessByUserId);
app.put('/updateBusiness/:id', updateBusinessById); 
app.put('/updateBusinessPaymentById/:id', updateBusinessPaymentById); 
app.post('/updateBusinessStatus', updateBusinessStatus); 
app.get('/getBusinessByTitle', getBusinessByTitle); 
app.post("/default-val", saveDefaultVal);
app.get("/getDefaultVal", getDefaultVal);

app.post("/save-ai-data/:userId", saveAiDataToUser);
app.post("/updateAIData", updateAIData);
app.post("/saveGlobalValue", saveGlobalValue

);
app.get("/getAllGlobalData", getAllGlobalData);
app.get("/getPrice", getPrice);
app.post("/addPrice", addPrice);


import { addVIP, getVIPs, deleteVIP } from './controller/vip.controller';


app.post('/vip', addVIP);         // Add a phone to VIP list
app.get('/vip', getVIPs);         // Get all VIP phones
app.delete('/vip/:phone', deleteVIP); // Delete a phone from VIP list

export default router;




app.use("/admin", router);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

startPlanExpiryJob();

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log(
    "SIGTERM received. Closing HTTP server and MongoDB connection..."
  );
  server.close(async () => {
    await closeDatabaseConnection();
    process.exit(0);
  });
});
