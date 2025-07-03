import express from "express";
import { sendOtpHandler, verifyOTPhandler } from "./routes/otpRoute";
import {
  saveUserPlanHandler,
  getLatestUserPlanHandler,
  savePlansDataHandler,
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
