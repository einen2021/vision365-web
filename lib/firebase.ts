import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Validate required environment variables
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for missing required variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0 && typeof window === "undefined") {
  console.error(
    `❌ Missing required Firebase environment variables: ${missingVars.join(
      ", "
    )}\n` +
      `Please create a .env.local file with your Firebase configuration.\n` +
      `See .env.example for reference.`
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey || "dummy-api-key",
  authDomain: requiredEnvVars.authDomain || "dummy-project.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: requiredEnvVars.projectId || "dummy-project",
  storageBucket: requiredEnvVars.storageBucket || "dummy-project.appspot.com",
  messagingSenderId: requiredEnvVars.messagingSenderId || "123456789",
  appId: requiredEnvVars.appId || "1:123456789:web:abcdef",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if we have valid config
let app: FirebaseApp | null = null;

if (getApps().length === 0) {
  // Only initialize if we have at least the API key
  if (requiredEnvVars.apiKey && requiredEnvVars.apiKey !== "dummy-api-key") {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("❌ Firebase initialization error:", error);
      if (typeof window !== "undefined") {
        console.error(
          "Please check your Firebase configuration in .env.local file."
        );
      }
    }
  } else {
    if (typeof window !== "undefined") {
      console.warn(
        "⚠️ Firebase not configured. Please set up your .env.local file with Firebase credentials."
      );
    }
  }
} else {
  app = getApps()[0];
}

// Initialize Firestore and Auth only if app is initialized
export const db: Firestore | null = app ? getFirestore(app) : (null as any);
export const auth: Auth | null = app ? getAuth(app) : (null as any);

export default app;
