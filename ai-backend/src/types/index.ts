// Type Definitions for ReddyFit AI Coach

export interface MealAnalysisRequest {
  imageBase64: string;
  userId: string;
  timestamp?: Date;
}

export interface NutritionData {
  foodItems: FoodItem[];
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  micronutrients?: {
    vitamins: Record<string, number>;
    minerals: Record<string, number>;
  };
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  confidence: number;
}

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence: number;
}

export interface WorkoutPlan {
  title: string;
  description: string;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: Exercise[];
  caloriesBurned: number;
  reasoning: string; // Why this workout was suggested
}

export interface Exercise {
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: number; // seconds
  instructions: string[];
  formCues: string[];
  alternativeExercises?: string[];
}

export interface AICoachResponse {
  nutrition: NutritionData;
  suggestedWorkout: WorkoutPlan;
  aiInsights: string;
  timestamp: Date;
}

export interface FitnessKnowledge {
  id: string;
  type: 'exercise' | 'nutrition' | 'meal' | 'workout_plan';
  content: string;
  metadata: {
    muscle?: string;
    difficulty?: string;
    equipment?: string[];
    calories?: number;
    protein?: number;
    tags?: string[];
  };
}

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PineconeMatch {
  id: string;
  score: number;
  metadata: Record<string, any>;
}
