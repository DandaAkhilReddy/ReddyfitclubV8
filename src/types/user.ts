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

  // Usage Tracking (Body Scans)
  scansUsed: number;
  scansLimit: number;
  resetDate: Date;

  // AI Coach Trial & Usage Tracking
  aiCoachTrialStartDate?: Date;
  aiCoachTrialEndDate?: Date;
  aiCoachUsageCount: number;       // Current month usage
  aiCoachUsageLimit: number;       // Monthly limit (999999 during trial)
  aiCoachResetDate: Date;          // Monthly reset date

  // Profile Details
  age?: number;
  gender?: 'male' | 'female' | 'other';
  heightCm?: number;
  targetWeightKg?: number;
}

export interface BodySignature {
  uniqueId: string;
  goldenRatioScore: number;
  adonisIndex: number;
  symmetryCoefficient: number;
  compositionHash: string;
  bodyTypeClassification: string;
  aestheticScore: number;
  detailedMetrics: {
    waistToHipRatio: number;
    shoulderToWaistRatio: number;
    chestToWaistRatio: number;
    armToChestRatio: number;
    legTorsoBalance: number;
    upperLowerSymmetry: number;
  };
}

export interface ScanResult {
  id: string;
  userId: string;
  timestamp: Date;

  // Body Composition
  bodyFatPercentage: number;
  muscleMassLevel?: 'low' | 'moderate' | 'high';
  muscleMass?: number; // Legacy field for backward compatibility
  visceralFat?: number; // Legacy field
  physiqueRating?: number; // 1-10

  // Detailed Measurements
  measurements?: {
    chestCm: number;
    waistCm: number;
    hipsCm: number;
    bicepCm: number;
    thighCm: number;
    shoulderWidthCm: number;
    neckCm: number;
    calfCm: number;
    forearmCm: number;
    heightCm: number;
  };

  // Legacy measurements (for backward compatibility)
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;

  // Posture Analysis
  posture?: {
    quality: 'good' | 'fair' | 'needs improvement';
    notes: string;
  };

  // Fitness Assessment
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  muscleDevelopment?: {
    chest: 'low' | 'moderate' | 'good' | 'excellent';
    back: 'low' | 'moderate' | 'good' | 'excellent';
    shoulders: 'low' | 'moderate' | 'good' | 'excellent';
    arms: 'low' | 'moderate' | 'good' | 'excellent';
    core: 'low' | 'moderate' | 'good' | 'excellent';
    legs: 'low' | 'moderate' | 'good' | 'excellent';
  };

  // AI Analysis
  insights?: string[];
  recommendations?: {
    focusAreas?: string[];
    workoutSplit?: string;
    nutritionTips?: string;
    progressGoals?: string;
    // Legacy fields
    nutrition?: string;
    workout?: string;
    hydration?: string;
  };
  confidence?: number;
  notes?: string;

  // Nobel Prize-Level Body Signature
  bodySignature?: BodySignature;

  // AI-Generated Plans
  workoutPlan?: string;
  nutritionPlan?: string;

  // Image Data
  frontImageUrl: string;
  sideImageUrl?: string;
  backImageUrl?: string;
}
