// Body Scan Analysis API Service
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

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

export interface BodyScanResult {
  bodyFatPercentage: number;
  muscleMassLevel: 'low' | 'moderate' | 'high';
  physiqueRating: number;
  measurements: {
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
  posture: {
    quality: 'good' | 'fair' | 'needs improvement';
    notes: string;
  };
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  muscleDevelopment: {
    chest: 'low' | 'moderate' | 'good' | 'excellent';
    back: 'low' | 'moderate' | 'good' | 'excellent';
    shoulders: 'low' | 'moderate' | 'good' | 'excellent';
    arms: 'low' | 'moderate' | 'good' | 'excellent';
    core: 'low' | 'moderate' | 'good' | 'excellent';
    legs: 'low' | 'moderate' | 'good' | 'excellent';
  };
  recommendations: {
    focusAreas: string[];
    workoutSplit: string;
    nutritionTips: string;
    progressGoals: string;
  };
  confidence: number;
  notes: string;
  bodySignature?: BodySignature;
}

export interface BodyAnalysisResponse {
  scanResult: BodyScanResult;
  workoutPlan?: string;
  nutritionPlan?: string;
  timestamp: Date;
}

/**
 * Convert Firebase Storage URL to base64
 */
export async function convertImageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image URL to base64:', error);
    throw new Error(`Failed to convert image: ${error}`);
  }
}

/**
 * Analyze body composition from 1-3 photos
 */
export async function analyzeBody(
  imageUrls: string[],
  userId: string,
  options: {
    includeWorkoutPlan?: boolean;
    includeNutritionPlan?: boolean;
    goal?: 'lose_fat' | 'gain_muscle' | 'maintain';
  } = {}
): Promise<BodyAnalysisResponse> {
  try {
    console.log(`🏋️ Converting ${imageUrls.length} image(s) to base64...`);

    // Convert all image URLs to base64 in parallel
    const imageBase64Array = await Promise.all(
      imageUrls.map(url => convertImageUrlToBase64(url))
    );

    console.log(`✅ Images converted. Calling body analysis API...`);

    // Call the body analysis API
    const response = await axios.post<BodyAnalysisResponse>(
      `${API_BASE_URL}/body/analyze`,
      {
        imageBase64Array,
        userId,
        includeWorkoutPlan: options.includeWorkoutPlan ?? false,
        includeNutritionPlan: options.includeNutritionPlan ?? false,
        goal: options.goal || 'maintain',
      },
      {
        timeout: 60000, // 60 second timeout (GPT-4 Vision can be slow)
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Body analysis complete!`);
    console.log(`🔬 Body Signature: ${response.data.scanResult.bodySignature?.uniqueId}`);
    console.log(`📊 Body Fat: ${response.data.scanResult.bodyFatPercentage}%`);
    console.log(`🏆 Aesthetic Score: ${response.data.scanResult.bodySignature?.aestheticScore}/100`);

    return response.data;
  } catch (error: any) {
    console.error('Body analysis API error:', error);

    if (error.response) {
      // Server responded with error
      throw new Error(
        error.response.data?.message ||
        `API error: ${error.response.status} ${error.response.statusText}`
      );
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check if the AI backend is running.');
    } else {
      // Error in request setup
      throw new Error(error.message || 'Failed to analyze body composition');
    }
  }
}

/**
 * Compare two body scans to track progress
 */
export async function compareScans(
  previousScan: BodyScanResult,
  currentScan: BodyScanResult
): Promise<{
  bodyFatChange: number;
  muscleMassChange: string;
  measurementChanges: Record<string, number>;
  progressSummary: string;
  recommendations: string;
}> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/body/compare`,
      {
        previousScan,
        currentScan,
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Scan comparison API error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to compare scans'
    );
  }
}

/**
 * Get body signature interpretation
 */
export async function getBodySignatureInfo(uniqueId: string): Promise<{
  uniqueId: string;
  bodyTypeClassification: string;
  bodyFatPercentage: number;
  compositionHash: string;
  adonisIndex: number;
  interpretation: {
    bodyFat: string;
    adonisRating: string;
  };
}> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/body/signature/${uniqueId}`,
      {
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Body signature lookup error:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to lookup body signature'
    );
  }
}

export default {
  analyzeBody,
  compareScans,
  getBodySignatureInfo,
  convertImageUrlToBase64,
};
