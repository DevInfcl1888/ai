// config/firebase.ts

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');

function initializeFirebase() {
  // If file already exists, use it
  if (fs.existsSync(serviceAccountPath)) {
    console.log('🔐 Using existing service account file for Firebase Admin');
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
    });
    return;
  }

  // If GCP_CREDENTIALS env is available
  const gcpCredentialsBase64 = process.env.GCP_CREDENTIALS;
  if (gcpCredentialsBase64) {
    try {
      const decoded = Buffer.from(gcpCredentialsBase64, 'base64').toString('utf-8');
      fs.writeFileSync(serviceAccountPath, decoded);
      console.log('📝 Created service account file from GCP_CREDENTIALS env');

      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(decoded)),
      });
      return;
    } catch (err) {
      console.error('❌ Failed to decode and write GCP_CREDENTIALS:', err);
      throw err;
    }
  }

  throw new Error('❗ Firebase initialization failed: No service account file or GCP_CREDENTIALS provided.');
}

// Initialize if not already done
if (!admin.apps.length) {
  initializeFirebase();
}

export default admin;
