import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper to get env var from Vite environment
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return process.env[key];
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

const app = initializeApp(firebaseConfig);
export { app };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const storage = getStorage(app);

// Collection names for V8
export const Collections = {
  // Core user data
  USERS: 'users',
  USER_SETTINGS: 'user_settings',
  SUBSCRIPTIONS: 'subscriptions', // NEW: Stripe subscriptions
  USAGE_LOGS: 'usage_logs', // NEW: Track usage for limits

  // Product features
  SCANS: 'scans',
  BODY_ANALYSIS: 'body_analysis',
  MEAL_PLANS: 'meal_plans',
  WORKOUT_PLANS: 'workout_plans',

  // B2B Trainer features
  TRAINERS: 'trainers', // NEW: Trainer accounts
  CLIENTS: 'clients', // NEW: Trainer's clients
  TRAINING_PROGRAMS: 'training_programs', // NEW: Assigned programs

  // Social & Community
  COMMUNITY_USERS: 'community_users',
  ACCOUNTABILITY_PARTNERS: 'accountability_partners',

  // Analytics
  REVENUE_EVENTS: 'revenue_events', // NEW: Track revenue events
  CONVERSION_FUNNELS: 'conversion_funnels' // NEW: Track conversions
};
