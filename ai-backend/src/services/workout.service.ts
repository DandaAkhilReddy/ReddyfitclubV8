// Workout Generation Service
import groqService from './groq.service';
import pineconeService from './pinecone.service';
import { WorkoutPlan, NutritionData } from '../types';

class WorkoutService {
  /**
   * Generate workout plan based on meal nutrition
   * Smart algorithm: Balance calorie intake with workout intensity
   */
  async generateWorkoutFromMeal(nutrition: NutritionData): Promise<WorkoutPlan> {
    try {
      // Determine workout intensity based on meal calories
      const calorieIntake = nutrition.totalCalories;
      let workoutType: string;
      let duration: number;

      if (calorieIntake < 400) {
        workoutType = 'light cardio or active recovery';
        duration = 30;
      } else if (calorieIntake < 700) {
        workoutType = 'moderate strength training';
        duration = 45;
      } else {
        workoutType = 'intense strength and conditioning';
        duration = 60;
      }

      // Get relevant workout knowledge from RAG
      const context = await pineconeService.getContext(
        `${workoutType} workout exercises`,
        8
      );

      const systemPrompt = `You are an expert fitness coach. Create personalized workout plans.

WORKOUT DATABASE:
${context}

Use this knowledge to create evidence-based workout plans.`;

      const userPrompt = `Create a ${workoutType} workout plan for someone who just ate:
- ${calorieIntake} calories
- ${nutrition.macros.protein}g protein
- ${nutrition.macros.carbs}g carbs

Workout should:
1. Last approximately ${duration} minutes
2. Match the energy from this meal
3. Include 4-6 exercises with sets/reps
4. Be safe and effective

Return as JSON:
{
  "title": "Workout name",
  "description": "Brief description",
  "duration": ${duration},
  "difficulty": "intermediate",
  "exercises": [
    {
      "name": "Exercise name",
      "muscle": "target muscle",
      "sets": 3,
      "reps": "10-12",
      "rest": 60,
      "instructions": ["Step 1", "Step 2"],
      "formCues": ["Keep core tight", "Control the movement"]
    }
  ],
  "caloriesBurned": 300,
  "reasoning": "Why this workout complements your meal"
}`;

      const workoutPlan = await groqService.generateStructuredResponse<WorkoutPlan>(
        systemPrompt,
        userPrompt
      );

      return workoutPlan;
    } catch (error) {
      console.error('Workout Generation Error:', error);
      throw new Error('Failed to generate workout plan');
    }
  }

  /**
   * Generate workout based on user goals and preferences
   */
  async generateCustomWorkout(params: {
    goal: 'strength' | 'endurance' | 'weight_loss' | 'muscle_gain';
    duration: number; // minutes
    equipment: string[]; // e.g., ['dumbbells', 'barbell', 'bodyweight']
    experience: 'beginner' | 'intermediate' | 'advanced';
    targetMuscles?: string[]; // e.g., ['chest', 'back']
  }): Promise<WorkoutPlan> {
    const { goal, duration, equipment, experience, targetMuscles } = params;

    // Build search query for RAG
    const muscles = targetMuscles?.join(', ') || 'full body';
    const searchQuery = `${goal} ${experience} workout for ${muscles} using ${equipment.join(', ')}`;

    const context = await pineconeService.getContext(searchQuery, 10);

    const systemPrompt = `You are an elite strength and conditioning coach.

EXERCISE DATABASE:
${context}

Create science-based workout plans using progressive overload principles.`;

    const userPrompt = `Create a ${experience} level workout:
- Goal: ${goal}
- Duration: ${duration} minutes
- Equipment: ${equipment.join(', ')}
${targetMuscles ? `- Target muscles: ${targetMuscles.join(', ')}` : ''}

Include warm-up, main workout (5-7 exercises), and cool-down.
Return as JSON (same structure as before).`;

    return groqService.generateStructuredResponse<WorkoutPlan>(
      systemPrompt,
      userPrompt
    );
  }

  /**
   * Get workout recommendations based on time of day and meal timing
   */
  async getSmartRecommendations(params: {
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    lastMealTime: Date;
    lastMealCalories: number;
  }): Promise<string> {
    const hoursSinceMeal =
      (Date.now() - params.lastMealTime.getTime()) / (1000 * 60 * 60);

    let recommendation = '';

    if (hoursSinceMeal < 1) {
      recommendation = `Wait 30-60 minutes after eating before intense exercise. Try light stretching or a walk.`;
    } else if (hoursSinceMeal < 2) {
      recommendation = `Good time for moderate exercise. Your body has energy from the meal.`;
    } else if (hoursSinceMeal > 4) {
      recommendation = `It's been a while since your last meal. Consider a small snack before working out.`;
    } else {
      recommendation = `Optimal workout window! Your body is fueled and ready.`;
    }

    // Add time-of-day insights
    if (params.timeOfDay === 'morning') {
      recommendation += ` Morning workouts boost metabolism for the day.`;
    } else if (params.timeOfDay === 'evening') {
      recommendation += ` Evening workouts can aid sleep, but avoid high intensity 2 hours before bed.`;
    }

    return recommendation;
  }

  /**
   * Calculate calories burned during workout
   */
  calculateCaloriesBurned(params: {
    duration: number; // minutes
    intensity: 'low' | 'moderate' | 'high';
    bodyWeight: number; // kg
  }): number {
    const { duration, intensity, bodyWeight } = params;

    // MET (Metabolic Equivalent) values
    const metValues = {
      low: 3.5, // Light activity
      moderate: 5.5, // Moderate exercise
      high: 8.0, // Intense training
    };

    const met = metValues[intensity];

    // Calories = MET × weight(kg) × duration(hours)
    const calories = met * bodyWeight * (duration / 60);

    return Math.round(calories);
  }

  /**
   * Validate workout plan for safety
   */
  validateWorkout(workout: WorkoutPlan): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check duration
    if (workout.duration > 120) {
      warnings.push('Workout duration exceeds 2 hours - risk of overtraining');
    }

    // Check exercise count
    if (workout.exercises.length > 10) {
      warnings.push('Too many exercises - may lead to fatigue');
    }

    // Check rest periods
    workout.exercises.forEach((ex) => {
      if (ex.rest < 30) {
        warnings.push(`${ex.name}: Rest period too short (<30s)`);
      }
      if (ex.rest > 300) {
        warnings.push(`${ex.name}: Rest period too long (>5min)`);
      }
    });

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }
}

export default new WorkoutService();
