export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;

  // V8 Specific Fields
  createdAt: Date;
  subscription: 'free' | 'pro' | 'club';
  subscriptionEndDate?: Date;

  // Onboarding Data
  onboardingComplete: boolean;
  fitnessGoal?: 'lose_weight' | 'build_muscle' | 'get_lean' | 'stay_healthy';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';

  // Usage Tracking
  scansUsed: number;
  scansLimit: number;
  resetDate: Date;

  // Profile Details
  age?: number;
  gender?: 'male' | 'female' | 'other';
  heightCm?: number;
  targetWeightKg?: number;
}

export interface ScanResult {
  id: string;
  userId: string;
  timestamp: Date;

  // Body Composition
  bodyFatPercentage: number;
  muscleMass: number;
  visceralFat: number;

  // Measurements
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;

  // AI Analysis
  insights: string[];
  recommendations: {
    nutrition: string;
    workout: string;
    hydration: string;
  };

  // Image Data
  frontImageUrl: string;
  sideImageUrl?: string;
  backImageUrl?: string;
}
