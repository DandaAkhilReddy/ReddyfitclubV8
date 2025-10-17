// ReddyFit AI Backend - Main Server
import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import mealController from './controllers/meal.controller';
import workoutController from './controllers/workout.controller';
import bodyController from './controllers/body.controller';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware (for direct file uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ReddyFit AI Coach',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// MEAL ANALYSIS ENDPOINTS
// ============================================

/**
 * POST /api/meal/analyze-image
 * Body: { imageBase64: string, userId: string }
 * Returns: { nutrition, suggestedWorkout, aiInsights }
 */
app.post('/api/meal/analyze-image', mealController.analyzeMealFromImage.bind(mealController));

/**
 * POST /api/meal/analyze-description
 * Body: { description: string, userId: string }
 * Returns: { nutrition, suggestedWorkout, aiInsights }
 */
app.post('/api/meal/analyze-description', mealController.analyzeMealFromDescription.bind(mealController));

/**
 * POST /api/meal/calculate-goals
 * Body: { weight, height, age, gender, activityLevel, goal }
 * Returns: { calories, protein, carbs, fats }
 */
app.post('/api/meal/calculate-goals', mealController.calculateDailyGoals.bind(mealController));

// ============================================
// WORKOUT GENERATION ENDPOINTS
// ============================================

/**
 * POST /api/workout/generate
 * Body: { goal, duration, equipment[], experience, targetMuscles[]? }
 * Returns: { workout, validation }
 */
app.post('/api/workout/generate', workoutController.generateWorkout.bind(workoutController));

/**
 * POST /api/workout/recommendations
 * Body: { timeOfDay, lastMealTime, lastMealCalories }
 * Returns: { recommendation }
 */
app.post('/api/workout/recommendations', workoutController.getRecommendations.bind(workoutController));

/**
 * POST /api/workout/calculate-calories
 * Body: { duration, intensity, bodyWeight }
 * Returns: { caloriesBurned }
 */
app.post('/api/workout/calculate-calories', workoutController.calculateCalories.bind(workoutController));

// ============================================
// BODY SCAN ANALYSIS ENDPOINTS
// ============================================

/**
 * POST /api/body/analyze
 * Body: { imageBase64Array: string[], userId: string, includeWorkoutPlan?: boolean, includeNutritionPlan?: boolean, goal?: string }
 * Returns: { scanResult, workoutPlan?, nutritionPlan?, timestamp }
 */
app.post('/api/body/analyze', bodyController.analyzeBody.bind(bodyController));

/**
 * POST /api/body/compare
 * Body: { previousScan: BodyScanResult, currentScan: BodyScanResult }
 * Returns: { bodyFatChange, muscleMassChange, measurementChanges, progressSummary, recommendations }
 */
app.post('/api/body/compare', bodyController.compareScans.bind(bodyController));

/**
 * GET /api/body/signature/:uniqueId
 * Returns: Body signature interpretation
 */
app.get('/api/body/signature/:uniqueId', bodyController.getBodySignatureInfo.bind(bodyController));

// ============================================
// FILE UPLOAD ENDPOINT (Alternative to base64)
// ============================================

/**
 * POST /api/meal/upload-image
 * Multipart form: image file
 * Returns: { nutrition, suggestedWorkout, aiInsights }
 */
app.post('/api/meal/upload-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Convert buffer to base64
    const imageBase64 = req.file.buffer.toString('base64');

    // Reuse the image analysis controller
    req.body = { imageBase64, userId: req.body.userId };
    await mealController.analyzeMealFromImage(req, res);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to process uploaded image',
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ReddyFit AI Coach Backend');
  console.log('=' .repeat(50));
  console.log(`🌐 Server running: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔥 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=' .repeat(50));
  console.log('\n📚 Available Endpoints:');
  console.log('\n  🍽️  Meal Analysis:');
  console.log('    POST /api/meal/analyze-image');
  console.log('    POST /api/meal/analyze-description');
  console.log('    POST /api/meal/calculate-goals');
  console.log('    POST /api/meal/upload-image');
  console.log('\n  💪 Workout Generation:');
  console.log('    POST /api/workout/generate');
  console.log('    POST /api/workout/recommendations');
  console.log('    POST /api/workout/calculate-calories');
  console.log('\n  🏋️  Body Scan Analysis (NEW!):');
  console.log('    POST /api/body/analyze');
  console.log('    POST /api/body/compare');
  console.log('    GET  /api/body/signature/:uniqueId\n');
});

export default app;
