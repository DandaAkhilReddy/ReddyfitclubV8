// Meal Analysis API Controller
import { Request, Response } from 'express';
import nutritionService from '../services/nutrition.service';
import workoutService from '../services/workout.service';
import { AICoachResponse } from '../types';

class MealController {
  /**
   * POST /api/meal/analyze-image
   * Analyze meal from multiple photos and suggest workout
   */
  async analyzeMealFromImage(req: Request, res: Response) {
    try {
      const { imageBase64Array, userId } = req.body;

      // Support both single image (backwards compatible) and multiple images
      const images = Array.isArray(imageBase64Array) ? imageBase64Array : [imageBase64Array];

      if (!images || images.length === 0) {
        return res.status(400).json({ error: 'At least one image is required' });
      }

      const photoCount = images.length;
      console.log(`📸 Analyzing ${photoCount} meal photo${photoCount > 1 ? 's' : ''} for user: ${userId}`);

      // Step 1: Analyze nutrition from all images
      const nutrition = await nutritionService.analyzeMealFromImage(images);

      // Step 2: Generate matching workout
      const workout = await workoutService.generateWorkoutFromMeal(nutrition);

      // Step 3: Get AI insights
      const insights = await nutritionService.getMealInsights(nutrition);

      const response: AICoachResponse = {
        nutrition,
        suggestedWorkout: workout,
        aiInsights: insights,
        timestamp: new Date(),
      };

      console.log(`✅ Analysis complete (${photoCount} photo${photoCount > 1 ? 's' : ''}): ${nutrition.totalCalories} cal → ${workout.title}`);

      res.json(response);
    } catch (error: any) {
      console.error('Meal analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze meal',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/meal/analyze-description
   * Analyze meal from text description
   */
  async analyzeMealFromDescription(req: Request, res: Response) {
    try {
      const { description, userId } = req.body;

      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      console.log(`📝 Analyzing meal: "${description}"`);

      const nutrition = await nutritionService.analyzeMealFromDescription(
        description
      );
      const workout = await workoutService.generateWorkoutFromMeal(nutrition);
      const insights = await nutritionService.getMealInsights(nutrition);

      const response: AICoachResponse = {
        nutrition,
        suggestedWorkout: workout,
        aiInsights: insights,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      console.error('Meal analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze meal',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/meal/calculate-goals
   * Calculate daily nutrition goals
   */
  async calculateDailyGoals(req: Request, res: Response) {
    try {
      const { weight, height, age, gender, activityLevel, goal } = req.body;

      if (!weight || !height || !age || !gender || !activityLevel || !goal) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const goals = nutritionService.calculateDailyGoals({
        weight,
        height,
        age,
        gender,
        activityLevel,
        goal,
      });

      res.json(goals);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to calculate goals',
        message: error.message,
      });
    }
  }
}

export default new MealController();
