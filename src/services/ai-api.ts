// Frontend API Client for ReddyFit AI Coach
import axios from 'axios';

const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: AI_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for AI operations
});

export interface NutritionData {
  foodItems: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    confidence: number;
  }>;
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  confidence: number;
}

export interface WorkoutPlan {
  title: string;
  description: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: Array<{
    name: string;
    muscle: string;
    sets: number;
    reps: string;
    rest: number;
    instructions: string[];
    formCues: string[];
    alternativeExercises?: string[];
  }>;
  caloriesBurned: number;
  reasoning: string;
}

export interface AICoachResponse {
  nutrition: NutritionData;
  suggestedWorkout: WorkoutPlan;
  aiInsights: string;
  timestamp: Date;
}

class AIApiService {
  /**
   * Analyze meal from multiple images
   */
  async analyzeMealFromImage(imageFiles: File | File[], userId: string): Promise<AICoachResponse> {
    // Support both single file (backwards compatible) and multiple files
    const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];

    // Convert all images to base64
    const imageBase64Array = await Promise.all(
      files.map(file => this.fileToBase64(file))
    );

    const response = await apiClient.post<AICoachResponse>('/api/meal/analyze-image', {
      imageBase64Array,
      userId,
    });

    return response.data;
  }

  /**
   * Analyze meal from description
   */
  async analyzeMealFromDescription(
    description: string,
    userId: string
  ): Promise<AICoachResponse> {
    const response = await apiClient.post<AICoachResponse>('/api/meal/analyze-description', {
      description,
      userId,
    });

    return response.data;
  }

  /**
   * Upload image file directly (alternative method)
   */
  async uploadMealImage(imageFile: File, userId: string): Promise<AICoachResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('userId', userId);

    const response = await apiClient.post<AICoachResponse>(
      '/api/meal/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Calculate daily nutrition goals
   */
  async calculateDailyGoals(params: {
    weight: number; // kg
    height: number; // cm
    age: number;
    gender: 'male' | 'female';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    goal: 'lose_weight' | 'maintain' | 'gain_muscle';
  }): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }> {
    const response = await apiClient.post('/api/meal/calculate-goals', params);
    return response.data;
  }

  /**
   * Generate custom workout
   */
  async generateWorkout(params: {
    goal: 'strength' | 'endurance' | 'weight_loss' | 'muscle_gain';
    duration: number;
    equipment: string[];
    experience: 'beginner' | 'intermediate' | 'advanced';
    targetMuscles?: string[];
  }): Promise<{
    workout: WorkoutPlan;
    validation: {
      valid: boolean;
      warnings: string[];
    };
  }> {
    const response = await apiClient.post('/api/workout/generate', params);
    return response.data;
  }

  /**
   * Get workout recommendations
   */
  async getWorkoutRecommendations(params: {
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    lastMealTime: Date;
    lastMealCalories: number;
  }): Promise<{ recommendation: string }> {
    const response = await apiClient.post('/api/workout/recommendations', {
      ...params,
      lastMealTime: params.lastMealTime.toISOString(),
    });
    return response.data;
  }

  /**
   * Calculate calories burned
   */
  async calculateCaloriesBurned(params: {
    duration: number;
    intensity: 'low' | 'moderate' | 'high';
    bodyWeight: number;
  }): Promise<{ caloriesBurned: number }> {
    const response = await apiClient.post('/api/workout/calculate-calories', params);
    return response.data;
  }

  /**
   * Helper: Convert File to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/...;base64, prefix
        resolve(base64.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{
    status: string;
    service: string;
    version: string;
  }> {
    const response = await apiClient.get('/health');
    return response.data;
  }
}

export default new AIApiService();
