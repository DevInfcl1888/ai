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

//   // Map sentiment to message
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

//   const finalMessage = `${sentimentMessage}`;
//   const finalMess = `${sentimentMessage} \nCall Summary: ${callSummary}`;

//   try {
//     const usersCollection = await getCollection("users");
//     const user = await usersCollection.findOneAndUpdate(
//       { ai_number: toNumber },
//       { $inc: { call_count: 1 } },
//       { returnDocument: 'after' }
//     );

//     if (!user) {
//       console.log("No user found for number:", toNumber);
//       return;
//     }

//     const {
//       sms,
//       sms_type,
//       notification,
//       device_token,
//       contact,
//     } = user;

//     const sentiment = userSentiment.toLowerCase();

//     // --- Send SMS if enabled and allowed ---
//     const canSendSMS =
//       sms === true &&
//       (
//         (sms_type?.toLowerCase() === 'always') ||
//         (sms_type?.toLowerCase() === 'interested' && sentiment === 'positive')
//       );

//     if (canSendSMS) {
//       if (contact) {
//         console.log("📩 Sending SMS to", contact);
//         await sendSms(contact, finalMess);
//       } else {
//         console.warn("⚠️ No contact found. Cannot send SMS.");
//       }
//     } else {
//       console.log("📵 SMS is disabled or not applicable for this sentiment.");
//     }

//     // --- Send Push Notification if allowed ---
//     const notifSetting = notification?.toLowerCase();
//     const canSendNotif =
//       (notifSetting === 'always') ||
//       (notifSetting === 'interested' && sentiment === 'positive');

//     if (canSendNotif) {
//       if (device_token) {
//         console.log("📱 Sending FCM push notification to device token:", device_token);
//         await push(device_token, '📞 AI Call Result', finalMessage);
//       } else {
//         console.warn("⚠️ No device token found. Cannot send FCM notification.");
//       }
//     } else {
//       console.log("🔕 Notifications are disabled or not applicable for this sentiment.");
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

  const finalMessage = `${sentimentMessage}`;
  const finalMess = `${sentimentMessage} \nCall Summary: ${callSummary}`;

  try {
    const usersCollection = await getCollection("users");
    const user = await usersCollection.findOneAndUpdate(
      { ai_number: toNumber },
      { $inc: { call_count: 1 } },
      { returnDocument: 'after' }
    );

    if (!user) {
      console.log("No user found for number:", toNumber);
      return;
    }

    const {
      sms,
      sms_type,
      notification,
      device_token,
      contact,
    } = user;

    // --- Determine if we can send SMS ---
    const canSendSMS =
      sms === true &&
      sms_type?.toLowerCase() === 'interested' &&
      (sentiment === 'positive' || sentiment === 'neutral');

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

    // --- Determine if we can send Notification ---
    const canSendNotif =
      notification?.toLowerCase() === 'interested' &&
      (sentiment === 'positive' || sentiment === 'neutral');

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
