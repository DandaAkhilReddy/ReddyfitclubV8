// Body Scan Analysis API Controller
import { Request, Response } from 'express';
import bodyService from '../services/body.service';
import { BodyAnalysisResponse } from '../types';

class BodyController {
  /**
   * POST /api/body/analyze
   * Analyze body composition from 1-3 photos (front, side, back)
   * Returns: Body metrics + Mathematical Body Signature
   */
  async analyzeBody(req: Request, res: Response) {
    try {
      const { imageUrls, imageBase64Array, userId, includeWorkoutPlan, includeNutritionPlan, goal } = req.body;

      // Support both imageUrls (new) and imageBase64Array (legacy)
      let imagesToAnalyze: string[] = [];

      if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
        // New format: Download images from URLs
        console.log(`📥 Downloading ${imageUrls.length} image(s) from Firebase Storage...`);
        imagesToAnalyze = await bodyService.downloadAndConvertImages(imageUrls);
      } else if (imageBase64Array && Array.isArray(imageBase64Array) && imageBase64Array.length > 0) {
        // Legacy format: Use base64 directly
        imagesToAnalyze = imageBase64Array;
      } else {
        return res.status(400).json({ error: 'Either imageUrls or imageBase64Array is required' });
      }

      if (imagesToAnalyze.length > 3) {
        return res.status(400).json({ error: 'Maximum 3 photos allowed (front, side, back)' });
      }

      const photoCount = imagesToAnalyze.length;
      console.log(`🏋️ Analyzing ${photoCount} body photo${photoCount > 1 ? 's' : ''} for user: ${userId}`);

      // Step 1: Analyze body composition from all images
      const scanResult = await bodyService.analyzeBodyFromImages(imagesToAnalyze);

      // Step 2: Generate workout plan if requested
      let workoutPlan: string | undefined;
      if (includeWorkoutPlan) {
        console.log('💪 Generating personalized workout plan...');
        workoutPlan = await bodyService.getWorkoutPlan(scanResult);
      }

      // Step 3: Generate nutrition plan if requested
      let nutritionPlan: string | undefined;
      if (includeNutritionPlan) {
        console.log('🍽️ Generating nutrition recommendations...');
        const userGoal = goal || 'maintain'; // Default to maintain
        nutritionPlan = await bodyService.getNutritionPlan(scanResult, userGoal);
      }

      const response: BodyAnalysisResponse = {
        scanResult,
        workoutPlan,
        nutritionPlan,
        timestamp: new Date(),
      };

      console.log(`✅ Body analysis complete (${photoCount} photo${photoCount > 1 ? 's' : ''}): ${scanResult.bodyFatPercentage}% BF, ${scanResult.fitnessLevel} level`);
      console.log(`🔬 Body Signature: ${scanResult.bodySignature?.uniqueId}`);
      console.log(`🏆 Aesthetic Score: ${scanResult.bodySignature?.aestheticScore}/100`);
      console.log(`⚖️ Adonis Index: ${scanResult.bodySignature?.adonisIndex}`);

      res.json(response);
    } catch (error: any) {
      console.error('Body analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze body composition',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/body/compare
   * Compare two body scans to track progress
   */
  async compareScans(req: Request, res: Response) {
    try {
      const { previousScan, currentScan } = req.body;

      if (!previousScan || !currentScan) {
        return res.status(400).json({ error: 'Both previousScan and currentScan are required' });
      }

      console.log('📊 Comparing body scans for progress tracking...');

      const comparison = await bodyService.compareScans(previousScan, currentScan);

      console.log(`✅ Comparison complete: ${comparison.bodyFatChange > 0 ? '+' : ''}${comparison.bodyFatChange.toFixed(1)}% body fat change`);

      res.json(comparison);
    } catch (error: any) {
      console.error('Scan comparison error:', error);
      res.status(500).json({
        error: 'Failed to compare scans',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/body/signature/:uniqueId
   * Retrieve body type classification based on unique signature
   * This allows filtering/searching by body metrics
   */
  async getBodySignatureInfo(req: Request, res: Response) {
    try {
      const { uniqueId } = req.params;

      // Parse unique ID format: BODYTYPE-BF%-HASH-ADONIS
      const parts = uniqueId.split('-');
      if (parts.length !== 4) {
        return res.status(400).json({ error: 'Invalid unique ID format' });
      }

      const [bodyType, bfPart, hash, adonisIsPart] = parts;
      const bodyFatPercentage = parseFloat(bfPart.replace('BF', ''));
      const adonisIndex = parseFloat(adonisIsPart.replace('AI', ''));

      res.json({
        uniqueId,
        bodyTypeClassification: bodyType.replace(/([A-Z])/g, ' $1').trim(),
        bodyFatPercentage,
        compositionHash: hash,
        adonisIndex,
        interpretation: {
          bodyFat: bodyFatPercentage < 10 ? 'Very Lean' :
                    bodyFatPercentage < 15 ? 'Lean' :
                    bodyFatPercentage < 20 ? 'Fit' :
                    bodyFatPercentage < 25 ? 'Average' : 'High',
          adonisRating: adonisIndex >= 1.6 ? 'Excellent (Near Golden Ratio)' :
                        adonisIndex >= 1.4 ? 'Very Good' :
                        adonisIndex >= 1.2 ? 'Good' : 'Room for Improvement',
        },
      });
    } catch (error: any) {
      console.error('Body signature lookup error:', error);
      res.status(500).json({
        error: 'Failed to lookup body signature',
        message: error.message,
      });
    }
  }
}

export default new BodyController();
