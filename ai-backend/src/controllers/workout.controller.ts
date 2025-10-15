// Workout Generation API Controller
import { Request, Response } from 'express';
import workoutService from '../services/workout.service';

class WorkoutController {
  /**
   * POST /api/workout/generate
   * Generate custom workout plan
   */
  async generateWorkout(req: Request, res: Response) {
    try {
      const { goal, duration, equipment, experience, targetMuscles } = req.body;

      if (!goal || !duration || !equipment || !experience) {
        return res.status(400).json({
          error: 'Missing required fields: goal, duration, equipment, experience',
        });
      }

      console.log(`💪 Generating ${experience} ${goal} workout (${duration}min)`);

      const workout = await workoutService.generateCustomWorkout({
        goal,
        duration,
        equipment,
        experience,
        targetMuscles,
      });

      // Validate workout for safety
      const validation = workoutService.validateWorkout(workout);
      if (!validation.valid) {
        console.warn('⚠️ Workout validation warnings:', validation.warnings);
      }

      res.json({
        workout,
        validation,
      });
    } catch (error: any) {
      console.error('Workout generation error:', error);
      res.status(500).json({
        error: 'Failed to generate workout',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/workout/recommendations
   * Get smart workout recommendations based on context
   */
  async getRecommendations(req: Request, res: Response) {
    try {
      const { timeOfDay, lastMealTime, lastMealCalories } = req.body;

      if (!timeOfDay || !lastMealTime || lastMealCalories === undefined) {
        return res.status(400).json({
          error: 'Missing required fields',
        });
      }

      const recommendation = await workoutService.getSmartRecommendations({
        timeOfDay,
        lastMealTime: new Date(lastMealTime),
        lastMealCalories,
      });

      res.json({ recommendation });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to get recommendations',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/workout/calculate-calories
   * Calculate calories burned
   */
  async calculateCalories(req: Request, res: Response) {
    try {
      const { duration, intensity, bodyWeight } = req.body;

      if (!duration || !intensity || !bodyWeight) {
        return res.status(400).json({
          error: 'Missing required fields: duration, intensity, bodyWeight',
        });
      }

      const caloriesBurned = workoutService.calculateCaloriesBurned({
        duration,
        intensity,
        bodyWeight,
      });

      res.json({ caloriesBurned });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to calculate calories',
        message: error.message,
      });
    }
  }
}

export default new WorkoutController();
