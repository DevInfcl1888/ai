import express from "express";

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
} from "./routes/socialRoute";
import router from "./routes/admin.route";

import { sendSmsHandler } from "./controller/send.controller";

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

const app = express();
app.use(express.json());

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


// app.post("/retell-webhook", async (req, res) => {
//   console.log("🔔 RETELL AI WEBHOOK ENDPOINT HIT!");
//   console.log("⏰ Timestamp:", new Date().toISOString());
  
//   try {
//     const webhookData = req.body;
//     console.log("📥 Webhook Data Received:", webhookData);
    
//     // Log the webhook data for debugging
//     console.log("📥 Webhook Data Received:");

    
//     // Check if this is a call_ended event
//     if (webhookData.event === "call_ended") {
//       console.log("📞 CALL ENDED EVENT DETECTED!");
       
//     } else {
//       console.log("ℹ️ Non-call-ended event received:", webhookData.event);
//     }
//     // Always respond with 200 OK to acknowledge receipt
//     console.log("✅ Webhook processed successfully, sending 200 OK");
//     res.status(200).json({ message: "Webhook received successfully" });
    
//   } catch (error) {
//     console.error("💥 ERROR processing Retell AI webhook:", error);
//     console.error("Stack trace:", (error as Error).stack);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
// app.post("/retell-webhook", async (req, res) => {
//   console.log("🔔 RETELL AI WEBHOOK ENDPOINT HIT!");
//   console.log("⏰ Timestamp:", new Date().toISOString());
  
//   try {
//     const webhookData = req.body;
    
//     // Log the webhook data for debugging
//     console.log("📥 Webhook Data Received:");
//     console.log("Raw Body:", JSON.stringify(webhookData, null, 2));

    
//     // Check if this is a call_ended event
//     if (webhookData.event === "call_ended") {
//       console.log("📞 CALL ENDED EVENT DETECTED!");
      
//       // // Debug webhook structure
//       // // Handle different possible webhook structures
//       // let callData;
//       // if (webhookData.data) {
//       //   callData = webhookData.data;
//       // } else if (webhookData.call) {
//       //   callData = webhookData.call;
//       // } else {
//       //   // Sometimes the call data is directly in the webhook payload
//       //   callData = webhookData;
//       // }
      
      
//       // if (!callData) {
//       //   console.error("❌ No call data found in webhook payload!");
//       //   res.status(400).json({ error: "No call data found in webhook payload" });
//       //   return;
//       // }
      
//       // // Safely extract call information with default values
//       // const {
//       //   call_id = null,
//       //   from_number = null,
//       //   to_number = null,
//       //   call_status = null,
//       //   end_reason = null,
//       //   duration = 0,
//       //   agent_id = null,
//       //   recording_url = null,
//       //   transcript = null,
//       //   // Alternative field names that Retell might use
//       //   id = null,
//       //   from = null,
//       //   to = null,
//       //   status = null,
//       //   reason = null,
//       //   call_duration = null,
//       //   // Add more fields as needed based on Retell AI webhook payload
//       // } = callData;
      
//       // // Use fallback values if primary fields are not available
//       // const finalCallData = {
//       //   call_id: call_id || id,
//       //   from_number: from_number || from,
//       //   to_number: to_number || to,
//       //   call_status: call_status || status,
//       //   end_reason: end_reason || reason,
//       //   duration: duration || call_duration || 0,
//       //   agent_id,
//       //   recording_url,
//       //   transcript,
//       //   // Pass through all original data
//       //   ...callData
//       // };
      
//       // // Validate required fields
//       // if (!finalCallData.call_id && !finalCallData.id) {
//       //   console.error("❌ No call ID found in webhook data!");
//       //   res.status(400).json({ error: "No call ID found in webhook data" });
//       //   return;
//       // }
      
//       // // Enhanced sentiment analysis with Neutral, Positive, Negative
//       // const sentimentAnalysis = await analyzeCallSentiment(finalCallData);
//       // console.log("🎯 Call Sentiment Analysis:");
//       // console.log("   Sentiment:", sentimentAnalysis.sentiment);
//       // console.log("   Confidence:", sentimentAnalysis.confidence);
//       // console.log("   Reason:", sentimentAnalysis.reason);
      
//       // // Get AI number (agent phone number)
//       // const aiNumber = getAINumber(finalCallData);
//       // console.log("🤖 AI Number:", aiNumber);
      
//       // // Generate call summary
//       // const callSummary = await generateCallSummary(finalCallData);
//       // console.log("📝 Call Summary:");
//       // console.log("   Summary:", callSummary.summary);
//       // console.log("   Key Points:", callSummary.keyPoints);
//       // console.log("   Customer Intent:", callSummary.customerIntent);
//       // console.log("   Resolution Status:", callSummary.resolutionStatus);
      
//       // // Get user phone number (adjust based on your use case)
//       // const userPhoneNumber = finalCallData.from_number || finalCallData.to_number;
//       // console.log("📱 User Phone Number:", userPhoneNumber);
      
//       // if (userPhoneNumber) {
//       //   // Send message based on sentiment
//       //   switch (sentimentAnalysis.sentiment) {
//       //     case "POSITIVE":
//       //       console.log("✅ Sending POSITIVE call message...");
//       //       await sendPositiveCallMessage(userPhoneNumber, finalCallData, sentimentAnalysis, callSummary);
//       //       break;
//       //     case "NEGATIVE":
//       //       console.log("❌ Sending NEGATIVE call message...");
//       //       await sendNegativeCallMessage(userPhoneNumber, finalCallData, sentimentAnalysis, callSummary);
//       //       break;
//       //     case "NEUTRAL":
//       //       console.log("🔄 Sending NEUTRAL call message...");
//       //       await sendNeutralCallMessage(userPhoneNumber, finalCallData, sentimentAnalysis, callSummary);
//       //       break;
//       //   }
//       // } else {
//       //   console.log("⚠️ No user phone number found in call data");
//       // }
      
//       // Save enhanced call data to database
//       console.log("💾 Saving enhanced call data to database...");
//       // await saveEnhancedCallDataToDatabase({
//       //   ...finalCallData,
//       //   sentiment: sentimentAnalysis,
//       //   aiNumber,
//       //   callSummary,
//       //   processedAt: new Date()
//       // });
      
//     } else {
//       console.log("ℹ️ Non-call-ended event received:", webhookData.event);
//     }
    
//     // Always respond with 200 OK to acknowledge receipt
//     console.log("✅ Webhook processed successfully, sending 200 OK");
//     res.status(200).json({ message: "Webhook received successfully" });
    
//   } catch (error) {
//     console.error("💥 ERROR processing Retell AI webhook:", error);
//     console.error("Stack trace:", (error as Error).stack);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// Enhanced sentiment analysis function


app.post("/retell-webhook", async (req, res) => {
  console.log("🔔 RETELL AI WEBHOOK ENDPOINT HIT!");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    const webhookData = req.body;
    // console.log("📥 Webhook Data Received:", webhookData);

    const event = webhookData.event;
    const call = webhookData.call;

    if (event === "call_ended") {
      console.log("📞 CALL ENDED EVENT DETECTED!");
      // You can process call_ended here as needed

    } else if (event === "call_analyzed") {
      console.log("📊 CALL ANALYZED EVENT DETECTED!");

      const callSummary = call?.call_analysis?.call_summary || "No summary";
      const userSentiment = call?.call_analysis?.user_sentiment || "Unknown";
      const toNumber = call?.to_number || "Unknown";

      console.log("📄 Call Summary:", callSummary);
      console.log("💬 User Sentiment:", userSentiment);
      console.log("📞 To Number:", toNumber);

      // Call your custom function
      await sendNotify({ callSummary, userSentiment, toNumber });

    } else {
      console.log("ℹ️ Non-call-ended event received:", event);
    }

    res.status(200).json({ message: "Webhook received successfully" });
  } catch (error) {
    console.error("💥 ERROR processing Retell AI webhook:", error);
    console.error("Stack trace:", (error as Error).stack);
    res.status(500).json({ error: "Internal server error" });
  }
});


import { getCollection } from './config/database'; // Adjust path as needed
import { sendSms } from './services/sendSMS'; // adjust path
import  {push}  from './services/sendPushNotification'; // adjust path

// import admin from 'firebase-admin';


// const sendNotify = async ({
//   callSummary,
//   userSentiment,
//   toNumber,
// }: {
//   callSummary: string;
//   userSentiment: string;
//   toNumber: string;
// }) => {
//   console.log("🚀 Sending notification:");
//   console.log("Sentiment:", userSentiment);
//   console.log("To:", toNumber);

//   // Map sentiment to human message
//   let sentimentMessage = '';
//   switch (userSentiment.toLowerCase()) {
//     case 'positive':
//       sentimentMessage = 'Customer is interested';
//       break;
//     case 'neutral':
//       sentimentMessage = 'Customer is Neutral';
//       break;
//     case 'negative':
//       sentimentMessage = 'Customer is not interested';
//       break;
//     default:
//       sentimentMessage = 'Customer sentiment is unknown';
//   }

//   try {
//     const usersCollection = await getCollection("users");
//     const user = await usersCollection.findOne({ ai_number: toNumber });

//     if (!user) {
//       console.log("No user found for number:", toNumber);
//       return;
//     }

//     const { sms, notification, device_token, contact } = user;

//     // --- Send SMS if enabled ---
//     if (sms === true) {
//       console.log("📩 Sending SMS to", contact || "unknown contact");
//       await sendSms(contact, sentimentMessage);
//     } else {
//       console.log("📵 SMS is disabled for this user.");
//     }

//     // --- Send Push Notification if allowed ---
//     if (typeof notification === "string" && notification.toLowerCase() === "always") {
//       if (device_token) {
//         console.log("📱 Sending FCM push notification to device token:", device_token);
//         await push(device_token, '📞 AI Call Result', sentimentMessage);
//       } else {
//         console.warn("⚠️ No device token found. Cannot send FCM notification.");
//       }
//     } else {
//       console.log("🔕 Notifications are not enabled for this user.");
//     }
//   } catch (error) {
//     console.error("💥 Error in sendNotify:", error);
//   }
// };
const sendNotify = async ({
  callSummary,
  userSentiment,
  toNumber,
}: {
  callSummary: string;
  userSentiment: string;
  toNumber: string;
}) => {
  console.log("🚀 Sending notification:");
  console.log("Sentiment:", userSentiment);
  console.log("To:", toNumber);

  // Map sentiment to message
  let sentimentMessage = '';
  switch (userSentiment.toLowerCase()) {
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

  const finalMessage = `Sentiment: ${userSentiment}\n${sentimentMessage}`;

  try {
    const usersCollection = await getCollection("users");
    const user = await usersCollection.findOne({ ai_number: toNumber });

    if (!user) {
      console.log("No user found for number:", toNumber);
      return;
    }

    const { sms, notification, device_token, contact } = user;

    // --- Send SMS if enabled ---
    if (sms === true) {
      console.log("📩 Sending SMS to", contact || "unknown contact");
      await sendSms(contact, finalMessage);
    } else {
      console.log("📵 SMS is disabled for this user.");
    }

    // --- Send Push Notification if allowed ---
    if (typeof notification === "string" && notification.toLowerCase() === "always") {
      if (device_token) {
        console.log("📱 Sending FCM push notification to device token:", device_token);
        await push(device_token, '📞 AI Call Result', finalMessage);
      } else {
        console.warn("⚠️ No device token found. Cannot send FCM notification.");
      }
    } else {
      console.log("🔕 Notifications are not enabled for this user.");
    }
  } catch (error) {
    console.error("💥 Error in sendNotify:", error);
  }
};


// const sendNotify = async ({
//   callSummary,
//   userSentiment,
//   toNumber,
// }: {
//   callSummary: string;
//   userSentiment: string;
//   toNumber: string;
// }) => {
//   console.log("🚀 Sending notification with the following info:");
//   console.log("Summary:", callSummary);
//   console.log("Sentiment:", userSentiment);
//   console.log("To:", toNumber);

//   try {
//     const usersCollection = await getCollection("users");

//     const user = await usersCollection.findOne({ ai_number: toNumber });

//     if (!user) {
//       console.log("No user found for number:", toNumber);
//       return;
//     }

//     const { sms, notification, device_token, contact } = user;

//     // --- Send SMS if enabled ---
//     if (sms === true) {
//       console.log("📩 Sending SMS to", contact || "unknown contact");
//       // TODO: Add your actual SMS sending logic here
//       await sendSms(contact, `Summary: ${callSummary}\nSentiment: ${userSentiment}`);
//     } else {
//       console.log(" SMS is disabled for this user.");
//     }

//     // --- Send Push Notification if allowed ---
//     if (typeof notification === "string" && notification.toLowerCase() === "always") {
//       if (device_token) {
//         console.log("📱 Sending FCM push notification to device token:", device_token);
//         await push(device_token, ' AI Call Summary', `${callSummary} (Sentiment: ${userSentiment})`
// );
//       } else {
//         console.warn("⚠️ No device token found. Cannot send FCM notification.");
//       }
//     } else {
//       console.log("🔕 Notifications are not enabled for this user.");
//     }
//   } catch (error) {
//     console.error("💥 Error in sendNotify:", error);
//   }
// };


// ===== RETELL AI WEBHOOK HANDLER =====
// app.post("/retell-webhook", async (req, res) => {
//   console.log("🔔 RETELL AI WEBHOOK ENDPOINT HIT!");
//   console.log("⏰ Timestamp:", new Date().toISOString());
  
//   try {
//     const webhookData = req.body;
    
//     // Log the webhook data for debugging
//     console.log("📥 Webhook Data Received:");
//     console.log("Raw Body:", JSON.stringify(webhookData, null, 2));
    
//     // Check if this is a call_ended event
//     if (webhookData.event === "call_ended") {
//       console.log("📞 CALL ENDED EVENT DETECTED!");
      
//       const callData = webhookData.data;
      
//       // Extract call information
//       const {
//         call_id,
//         from_number,
//         to_number,
//         call_status,
//         end_reason,
//         duration,
//         // Add more fields as needed based on Retell AI webhook payload
//       } = callData;
      
//       console.log("📊 Call Details:");
//       console.log("   Call ID:", call_id);
//       console.log("   From:", from_number);
//       console.log("   To:", to_number);
//       console.log("   Status:", call_status);
//       console.log("   End Reason:", end_reason);
//       console.log("   Duration:", duration);
      
//       // Determine if call was positive or negative
//       const isPositiveCall = determineCallSentiment(callData);
//       console.log("🎯 Call Sentiment Analysis:");
//       console.log("   Is Positive Call:", isPositiveCall);
      
//       // Get user phone number (adjust based on your use case)
//       const userPhoneNumber = from_number || to_number;
//       console.log("📱 User Phone Number:", userPhoneNumber);
      
//       if (userPhoneNumber) {
//         if (isPositiveCall) {
//           console.log("✅ Sending POSITIVE call message...");
//           await sendPositiveCallMessage(userPhoneNumber, callData);
//         } else {
//           console.log("❌ Sending NEGATIVE call message...");
//           await sendNegativeCallMessage(userPhoneNumber, callData);
//         }
//       } else {
//         console.log("⚠️ No user phone number found in call data");
//       }
      
//       // Optional: Save call data to database
//       console.log("💾 Saving call data to database...");
//       await saveCallDataToDatabase(callData);
      
//     } else {
//       console.log("ℹ️ Non-call-ended event received:", webhookData.event);
//     }
    
//     // Always respond with 200 OK to acknowledge receipt
//     console.log("✅ Webhook processed successfully, sending 200 OK");
//     res.status(200).json({ message: "Webhook received successfully" });
    
//   } catch (error) {
//     console.error("💥 ERROR processing Retell AI webhook:", error);
//     console.error("Stack trace:", (error as Error).stack);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Helper function to determine call sentiment
// function determineCallSentiment(callData: RetellCallData): boolean {
//   console.log("🔍 ANALYZING CALL SENTIMENT:");
  
//   // Customize this logic based on your needs
//   const { end_reason, duration } = callData;
  
//   console.log("   End Reason:", end_reason);
//   console.log("   Duration:", duration);
  
//   let isPositive = true;
//   let reason = "";
  
//   // Example logic - adjust based on your requirements
//   if (end_reason === "user_hangup" && duration < 30) {
//     isPositive = false;
//     reason = "User hung up quickly (< 30 seconds)";
//   } else if (end_reason === "agent_hangup" || duration > 60) {
//     isPositive = true;
//     reason = "Normal completion or longer call (> 60 seconds)";
//   } else if (end_reason === "timeout") {
//     isPositive = false;
//     reason = "Call timed out";
//   } else {
//     isPositive = true;
//     reason = "Default positive (couldn't determine specific reason)";
//   }
  
//   console.log("   Analysis Result:", isPositive ? "POSITIVE" : "NEGATIVE");
//   console.log("   Reason:", reason);
  
//   return isPositive;
// }

// // Send positive call message
// async function sendPositiveCallMessage(phoneNumber: string, callData: RetellCallData): Promise<void> {
//   console.log("📤 SENDING POSITIVE CALL MESSAGE:");
//   console.log("   To:", phoneNumber);
  
//   try {
//     const message = "Thank you for your call! We're glad we could help. Feel free to reach out anytime if you need further assistance. 😊";
    
//     console.log("   Message:", message);
//     console.log("   Attempting to send SMS...");
    
//     // Using your existing SMS handler
//     await sendSMS(phoneNumber, message);
    
//     console.log("   SMS sent successfully!");
    
//     // Optional: Send push notification
//     console.log("   Attempting to send push notification...");
//     await sendPushNotification(phoneNumber, {
//       title: "Call Completed Successfully",
//       body: message,
//       type: "positive_call_end"
//     });
    
//     console.log("✅ Positive call message sent successfully to", phoneNumber);
//   } catch (error) {
//     console.error("💥 Error sending positive call message:", error);
//     console.error("Stack trace:", (error as Error).stack);
//   }
// }

// // Send negative call message
// async function sendNegativeCallMessage(phoneNumber: string, callData: RetellCallData): Promise<void> {
//   console.log("📤 SENDING NEGATIVE CALL MESSAGE:");
//   console.log("   To:", phoneNumber);
  
//   try {
//     const message = "We noticed your call ended early. Our support team is here to help! Reply 'HELP' or call us back if you need assistance.";
    
//     console.log("   Message:", message);
//     console.log("   Attempting to send SMS...");
    
//     // Using your existing SMS handler
//     await sendSMS(phoneNumber, message);
    
//     console.log("   SMS sent successfully!");
    
//     // Optional: Send push notification
//     console.log("   Attempting to send push notification...");
//     await sendPushNotification(phoneNumber, {
//       title: "Need Additional Help?",
//       body: message,
//       type: "negative_call_end"
//     });
    
//     console.log("✅ Negative call message sent successfully to", phoneNumber);
//   } catch (error) {
//     console.error("💥 Error sending negative call message:", error);
//     console.error("Stack trace:", (error as Error).stack);
//   }
// }

// // Helper function to send SMS (integrate with your existing SMS service)
// async function sendSMS(phoneNumber: string, message: string): Promise<void> {
//   console.log("📱 SMS SENDING PROCESS:");
//   console.log("   Phone:", phoneNumber);
//   console.log("   Message:", message);
  
//   // You can reuse your existing sendSmsHandler logic here
//   // Or create a new SMS service function
//   try {
//     // Example implementation - adjust based on your SMS service
//     const smsData = {
//       to: phoneNumber,
//       message: message
//     };
    
//     console.log("   SMS Data:", smsData);
    
//     // Call your existing SMS service
//     // await yourSmsService.send(smsData);
//     console.log("✅ SMS sent successfully to", phoneNumber);
//     console.log("   Message:", message);
//   } catch (error) {
//     console.error("💥 Error sending SMS:", error);
//     console.error("Stack trace:", (error as Error).stack);
//   }
// }

// // Helper function to send push notification
// async function sendPushNotification(phoneNumber: string, notificationData: NotificationData): Promise<void> {
//   console.log("🔔 PUSH NOTIFICATION SENDING PROCESS:");
//   console.log("   Phone:", phoneNumber);
//   console.log("   Notification Data:", notificationData);
  
//   try {
//     // Implement push notification logic here
//     // You can use Firebase, OneSignal, or other push notification services
    
//     // Example structure:
//     // await pushNotificationService.send({
//     //   user_identifier: phoneNumber,
//     //   title: notificationData.title,
//     //   body: notificationData.body,
//     //   data: { type: notificationData.type }
//     // });
    
//     console.log("✅ Push notification sent successfully to", phoneNumber);
//     console.log("   Title:", notificationData.title);
//     console.log("   Body:", notificationData.body);
//     console.log("   Type:", notificationData.type);
//   } catch (error) {
//     console.error("💥 Error sending push notification:", error);
//     console.error("Stack trace:", (error as Error).stack);
//   }
// }

// // Helper function to save call data to database
// async function saveCallDataToDatabase(callData: RetellCallData): Promise<void> {
//   console.log("💾 SAVING CALL DATA TO DATABASE:");
//   console.log("   Call ID:", callData.call_id);
  
//   try {
//     // Save call information to your database
//     // You can create a new collection/table for call logs
    
//     const callLog = {
//       call_id: callData.call_id,
//       from_number: callData.from_number,
//       to_number: callData.to_number,
//       call_status: callData.call_status,
//       end_reason: callData.end_reason,
//       duration: callData.duration,
//       timestamp: new Date(),
//       webhook_data: callData
//     };
    
//     console.log("   Call Log Object:", callLog);
    
//     // Save to your database
//     // await CallLog.create(callLog);
    
//     console.log("✅ Call data saved successfully to database");
//     console.log("   Timestamp:", callLog.timestamp);
//   } catch (error) {
//     console.error("💥 Error saving call data to database:", error);
//     console.error("Stack trace:", (error as Error).stack);
//   }
// }

// ===== END RETELL AI WEBHOOK HANDLER =====

app.post("/send-sms", sendSmsHandler);

// Routes
app.post("/otp/send", sendOtpHandler);
app.post("/otp/verify", verifyOTPhandler);
app.post("/login", loginHandler);
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

app.use("/admin", router);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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
// import express from "express";
// import { sendOtpHandler, verifyOTPhandler } from "./routes/otpRoute";
// import {
//   saveUserPlanHandler,
//   getLatestUserPlanHandler,
//   savePlansDataHandler,
//   updatePlan,
//   getAllPlansHandler,
//   deletePlanByIdHandler,
//   saveTermsHandler,
//   editTermsByIdHandler,
//   deleteTermsByIdHandler,
//   getTermsHandler,
// } from "./controller/admin.controller";
// import { connectToDatabase, closeDatabaseConnection } from "./config/database";
// import dotenv from "dotenv";
// import {
//   editProfileHandler,
//   getProfileHandler,
//   loginHandler,
//   updateUserPreferencesHandler,
// } from "./routes/loginRoute";
// import {
//   socialLoginHandler,
//   socialRegisterHandler,
//   deleteAccountHandler,
// } from "./routes/socialRoute";
// import router from "./routes/admin.route";

// import { sendSmsHandler } from "./controller/send.controller";

// //Info
// import {
//     enterContact,
//     getContact,
//     updateContact,
//     deleteContact,
//     enterTerm,
//     getTerm,
//     updateTerm,
//     deleteTerm,
//     enterPrivacy,
//     getPrivacy,
//     updatePrivacy,
//     deletePrivacy
// } from "./controller/info"  
// dotenv.config();

// const app = express();
// app.use(express.json());

// connectToDatabase()
//   .then(() => {
//     console.log("MongoDB connection established");
//   })
//   .catch((error) => {
//     console.error("Failed to connect to MongoDB:", error);
//     process.exit(1);
//   });

// import cors from "cors"; 

// // Allow specific origin (your frontend dev server)
// app.use(
//   cors({
//     origin: "*", // or "*" to allow all origins temporarily
//     credentials: true, // if you are using cookies
//   })
// );

// app.post("/send-sms", sendSmsHandler);

// // Routes

// app.post("/otp/send", sendOtpHandler);
// app.post("/otp/verify", verifyOTPhandler);
// app.post("/login", loginHandler);
// app.post("/social/register", socialRegisterHandler);
// app.post("/notifyToggle", updateUserPreferencesHandler);
// app.post("/social/login", socialLoginHandler);
// app.put("/edit-profile", editProfileHandler);
// app.get("/get-profile", getProfileHandler);
// app.delete("/delete-account", deleteAccountHandler);
// app.post("/plans", saveUserPlanHandler);
// app.get("/getplansDetails", getLatestUserPlanHandler);
// app.get("/getAllPlans", getAllPlansHandler);
// app.post("/savePlan", savePlansDataHandler);
// app.put("/update-plan/:id", updatePlan);
// app.delete("/plan/:id", deletePlanByIdHandler);
// app.post("/saveTerms", saveTermsHandler);
// app.get("/getTerms", getTermsHandler);
// app.put("/editTerms/:id", editTermsByIdHandler);
// app.delete("/deleteTerms/:id", deleteTermsByIdHandler);
// app.post("/add-contact",enterContact);
// app.get("/get-contact",getContact);
// app.put("/edit-contact/:id",updateContact);
// app.delete("/delete-contact/:id",deleteContact);
// app.post("/add-term",enterTerm);
// app.get("/get-term",getTerm);
// app.put("/update-term/:id",updateTerm);
// app.delete("/delete-term/:id",deleteTerm);
// app.post("/add-privacy",enterPrivacy);
// app.get("/get-privacy",getPrivacy);

// app.put("/edit-privacy/:id",updatePrivacy);
// app.delete("/delete-privacy/:id",deletePrivacy);

// app.use("/admin", router);


// const PORT = process.env.PORT || 3000;
// const server = app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// // Handle graceful shutdown
// process.on("SIGTERM", async () => {
//   console.log(
//     "SIGTERM received. Closing HTTP server and MongoDB connection..."
//   );
//   server.close(async () => {
//     await closeDatabaseConnection();
//     process.exit(0);
//   });
// });
