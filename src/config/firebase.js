import { initializeApp, cert } from 'firebase-admin/app';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the service account key in the root of the project
const serviceAccountPath = join(__dirname, '../../snaporia-207ae-firebase-adminsdk-fbsvc-7b5ba6b6fe.json');

export const initFirebase = () => {
  try {
    let serviceAccount;
    
    // First, try to load from an environment variable (useful for Render deployment)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // Fallback: try to read the local file
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    }

    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
  }
};
