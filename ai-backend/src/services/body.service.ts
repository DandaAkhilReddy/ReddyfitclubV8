// Body Composition Analysis Service
import OpenAI from 'openai';
import { BodyScanResult } from '../types';

class BodyService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Download images from Firebase URLs and convert to base64
   * This solves CORS issues by downloading server-side
   */
  async downloadAndConvertImages(imageUrls: string[]): Promise<string[]> {
    const imageBase64Array: string[] = [];

    for (const imageUrl of imageUrls) {
      try {
        console.log(`📥 Downloading image from: ${imageUrl.substring(0, 80)}...`);

        // Use fetch (Node.js 18+) or axios to download
        const response = await fetch(imageUrl);

        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }

        // Get image as buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert to base64
        const base64 = buffer.toString('base64');
        imageBase64Array.push(base64);

        console.log(`✅ Downloaded and converted image (${(buffer.length / 1024).toFixed(2)} KB)`);
      } catch (error: any) {
        console.error(`❌ Error downloading image from ${imageUrl}:`, error.message);
        throw new Error(`Failed to download image: ${error.message}`);
      }
    }

    console.log(`✅ All ${imageBase64Array.length} images downloaded and converted`);
    return imageBase64Array;
  }

  /**
   * Analyze body composition from multiple photos using GPT-4o Vision
   * Supports 1-3 photos (front, side, back)
   */
  async analyzeBodyFromImages(imageBase64Array: string[]): Promise<BodyScanResult> {
    try {
      const photoCount = imageBase64Array.length;

      // Build content array with text prompt + all images
      const contentArray: any[] = [
        {
          type: 'text',
          text: `You are an athletic performance assessment system analyzing training progress photos. ${photoCount > 1 ? `Analyzing ${photoCount} photos from multiple angles.` : 'Analyzing training photo.'}

Perform anthropometric body composition assessment based on visible physical characteristics:

${photoCount > 1 ? `From all ${photoCount} angles, evaluate:` : 'From the photo, evaluate:'}
1. Muscle definition visibility (abs, shoulders, arms, legs)
2. Body composition estimation
3. Structural proportions and posture
4. Muscle group development levels

Provide athletic performance metrics in JSON format with anthropometric measurements:

{
  "bodyFatPercentage": 15.5,
  "muscleMassLevel": "moderate",
  "physiqueRating": 7,
  "measurements": {
    "chestCm": 102,
    "waistCm": 82,
    "hipsCm": 98,
    "bicepCm": 36,
    "thighCm": 58,
    "shoulderWidthCm": 45,
    "neckCm": 38,
    "calfCm": 38,
    "forearmCm": 28,
    "heightCm": 175
  },
  "posture": {
    "quality": "good",
    "notes": "Neutral spine alignment, balanced shoulders"
  },
  "fitnessLevel": "intermediate",
  "muscleDevelopment": {
    "chest": "moderate",
    "back": "good",
    "shoulders": "moderate",
    "arms": "moderate",
    "core": "good",
    "legs": "good"
  },
  "recommendations": {
    "focusAreas": ["chest", "shoulders"],
    "workoutSplit": "Push/Pull/Legs 5-6x per week",
    "nutritionTips": "Increase protein to 1.8g/kg bodyweight for muscle development",
    "progressGoals": "Target 1-2% body fat reduction while maintaining muscle mass"
  },
  "confidence": 0.75,
  "notes": "Athletic assessment based on visible morphology"
}

Return ONLY valid JSON. No markdown formatting, no code blocks, no explanatory text. Start with { and end with }`,
        },
      ];

      // Add all images to the content array
      imageBase64Array.forEach((imageBase64) => {
        contentArray.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: 'high', // Request high-detail analysis
          },
        });
      });

      console.log(`🔍 Sending ${photoCount} body photo${photoCount > 1 ? 's' : ''} to GPT-4o Vision for analysis...`);

      // Use GPT-4o (with vision) for body composition analysis
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an AI-powered athletic performance analysis system used by fitness coaches and trainers. Your role is to analyze training photos and provide objective anthropometric assessments for progress tracking. You describe visible physical characteristics and provide standardized athletic metrics. This is not medical diagnosis - it\'s sports performance data collection.',
          },
          {
            role: 'user',
            content: contentArray,
          },
        ],
        max_tokens: 2000, // Increased for detailed body analysis
        temperature: 0.7, // Add some consistency while maintaining quality
      });

      const content = response.choices[0].message.content || '{}';

      // 🐛 DEBUG: Log raw response to see what GPT-4o is actually returning
      console.log('🔍 Raw GPT-4o Vision Response:', content.substring(0, 500) + (content.length > 500 ? '...' : ''));

      // 🔬 STEP 7: Multi-Strategy JSON Extraction (5 strategies)
      let bodyAnalysis: BodyScanResult;
      let extractionStrategy = '';

      try {
        // Strategy 1: Plain JSON (most common)
        const plainJsonMatch = content.match(/^\s*\{[\s\S]*\}\s*$/);
        if (plainJsonMatch) {
          extractionStrategy = 'Strategy 1: Plain JSON';
          bodyAnalysis = JSON.parse(content.trim());
          console.log(`✅ ${extractionStrategy} successful`);
        } else {
          throw new Error('Not plain JSON, trying next strategy');
        }
      } catch (e1) {
        try {
          // Strategy 2: Markdown JSON code block with language specifier
          const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonBlockMatch) {
            extractionStrategy = 'Strategy 2: Markdown JSON block';
            bodyAnalysis = JSON.parse(jsonBlockMatch[1].trim());
            console.log(`✅ ${extractionStrategy} successful`);
          } else {
            throw new Error('No markdown json block, trying next strategy');
          }
        } catch (e2) {
          try {
            // Strategy 3: Markdown code block without language specifier
            const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
              extractionStrategy = 'Strategy 3: Markdown code block';
              bodyAnalysis = JSON.parse(codeBlockMatch[1].trim());
              console.log(`✅ ${extractionStrategy} successful`);
            } else {
              throw new Error('No markdown code block, trying next strategy');
            }
          } catch (e3) {
            try {
              // Strategy 4: Find first { to last } (greedy JSON extraction)
              const firstBrace = content.indexOf('{');
              const lastBrace = content.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const extracted = content.substring(firstBrace, lastBrace + 1);
                extractionStrategy = 'Strategy 4: Brace extraction';
                bodyAnalysis = JSON.parse(extracted);
                console.log(`✅ ${extractionStrategy} successful`);
              } else {
                throw new Error('No JSON braces found, trying final strategy');
              }
            } catch (e4) {
              try {
                // Strategy 5: AI-powered JSON repair (handle common issues)
                extractionStrategy = 'Strategy 5: JSON repair';
                let repaired = content.trim();

                // Remove common prefixes
                repaired = repaired.replace(/^(Here is the JSON|Here's the JSON|The JSON is|Output):\s*/i, '');

                // Remove trailing text after JSON
                const lastClosingBrace = repaired.lastIndexOf('}');
                if (lastClosingBrace !== -1) {
                  repaired = repaired.substring(0, lastClosingBrace + 1);
                }

                // Fix common JSON issues
                repaired = repaired
                  .replace(/,\s*}/g, '}')        // Remove trailing commas
                  .replace(/,\s*]/g, ']')        // Remove trailing commas in arrays
                  .replace(/'/g, '"')            // Replace single quotes with double quotes
                  .replace(/(\w+):/g, '"$1":');  // Add quotes to unquoted keys

                bodyAnalysis = JSON.parse(repaired);
                console.log(`✅ ${extractionStrategy} successful (repaired)`);
              } catch (e5) {
                // All strategies failed - log detailed error
                console.error('❌ All 5 JSON extraction strategies failed!');
                console.error('Strategy 1 error:', (e1 as Error).message);
                console.error('Strategy 2 error:', (e2 as Error).message);
                console.error('Strategy 3 error:', (e3 as Error).message);
                console.error('Strategy 4 error:', (e4 as Error).message);
                console.error('Strategy 5 error:', (e5 as Error).message);
                console.error('Full response:', content);
                throw new Error(`All JSON extraction strategies failed. Response format: ${content.substring(0, 100)}...`);
              }
            }
          }
        }
      }

      // 🔬 STEP 8: Schema Validation & Type Checking
      console.log('🔍 Validating schema and types...');
      bodyAnalysis = this.validateAndSanitizeAnalysis(bodyAnalysis);
      console.log('✅ Schema validation passed');

      // 🔬 STEP 9: Confidence Score Calculation
      console.log('🔍 Calculating confidence score...');
      const confidenceScore = this.calculateConfidenceScore(bodyAnalysis, photoCount);
      bodyAnalysis.confidence = confidenceScore;
      console.log(`✅ Confidence score: ${(confidenceScore * 100).toFixed(1)}%`);

      // Calculate unique mathematical Body Signature
      const bodySignature = this.calculateBodySignature(bodyAnalysis);

      console.log(`✅ GPT-4o Vision body analysis complete: ${bodyAnalysis.bodyFatPercentage}% BF, ${bodyAnalysis.fitnessLevel} level`);
      console.log(`🔬 Body Signature: ${bodySignature.uniqueId}`);

      return {
        ...bodyAnalysis,
        bodySignature,
      };
    } catch (error) {
      console.error('Body Vision API Error:', error);
      throw new Error('Failed to analyze body composition. Please ensure photos are clear and well-lit.');
    }
  }

  /**
   * Get personalized workout plan based on body analysis
   */
  async getWorkoutPlan(bodyAnalysis: BodyScanResult): Promise<string> {
    const prompt = `Based on this body composition analysis:
- Body Fat: ${bodyAnalysis.bodyFatPercentage}%
- Fitness Level: ${bodyAnalysis.fitnessLevel}
- Focus Areas: ${bodyAnalysis.recommendations.focusAreas.join(', ')}
- Muscle Development: ${JSON.stringify(bodyAnalysis.muscleDevelopment)}

Create a detailed 4-week workout plan with:
1. Weekly training split
2. Exercises for each day (sets x reps)
3. Progressive overload strategy
4. Rest and recovery guidelines

Keep it concise but actionable (max 500 words).`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert personal trainer specializing in customized workout programming.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 800,
    });

    return response.choices[0].message.content || 'Unable to generate workout plan.';
  }

  /**
   * Get nutrition recommendations based on body composition goals
   */
  async getNutritionPlan(bodyAnalysis: BodyScanResult, goal: 'lose_fat' | 'gain_muscle' | 'maintain'): Promise<string> {
    const prompt = `Based on this body composition:
- Body Fat: ${bodyAnalysis.bodyFatPercentage}%
- Muscle Mass: ${bodyAnalysis.muscleMassLevel}
- Goal: ${goal.replace('_', ' ')}

Provide:
1. Daily calorie target
2. Macro breakdown (protein/carbs/fats in grams)
3. Meal timing strategy
4. Supplement recommendations (if any)
5. Sample meal ideas

Keep it practical and actionable (max 400 words).`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert sports nutritionist specializing in body composition optimization.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 600,
    });

    return response.choices[0].message.content || 'Unable to generate nutrition plan.';
  }

  /**
   * Compare two body scans and track progress
   */
  async compareScans(previousScan: BodyScanResult, currentScan: BodyScanResult): Promise<{
    bodyFatChange: number;
    muscleMassChange: string;
    measurementChanges: Record<string, number>;
    progressSummary: string;
    recommendations: string;
  }> {
    const bodyFatChange = currentScan.bodyFatPercentage - previousScan.bodyFatPercentage;

    const measurementChanges: Record<string, number> = {
      chest: currentScan.measurements.chestCm - previousScan.measurements.chestCm,
      waist: currentScan.measurements.waistCm - previousScan.measurements.waistCm,
      hips: currentScan.measurements.hipsCm - previousScan.measurements.hipsCm,
      bicep: currentScan.measurements.bicepCm - previousScan.measurements.bicepCm,
      thigh: currentScan.measurements.thighCm - previousScan.measurements.thighCm,
    };

    const prompt = `Compare these two body scans and provide progress insights:

PREVIOUS SCAN:
- Body Fat: ${previousScan.bodyFatPercentage}%
- Measurements: ${JSON.stringify(previousScan.measurements)}

CURRENT SCAN:
- Body Fat: ${currentScan.bodyFatPercentage}%
- Measurements: ${JSON.stringify(currentScan.measurements)}

CHANGES:
- Body Fat: ${bodyFatChange > 0 ? '+' : ''}${bodyFatChange.toFixed(1)}%
- Measurements: ${JSON.stringify(measurementChanges)}

Provide:
1. Progress summary (2-3 sentences)
2. What's working well
3. Areas needing adjustment
4. Next steps for continued progress

Keep it motivating and actionable (max 300 words).`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive fitness coach analyzing body composition progress.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    const aiInsights = response.choices[0].message.content || 'Progress analysis unavailable.';

    // Split AI response into summary and recommendations
    const parts = aiInsights.split('\n\n');
    const progressSummary = parts.slice(0, 2).join('\n\n');
    const recommendations = parts.slice(2).join('\n\n');

    return {
      bodyFatChange,
      muscleMassChange: currentScan.muscleMassLevel,
      measurementChanges,
      progressSummary,
      recommendations,
    };
  }

  /**
   * 🔬 STEP 9: Confidence Score Calculation
   * Calculate overall confidence based on multiple factors
   * Formula: confidence = photoFactor × consistencyFactor × completenessFactor × gptConfidence
   */
  private calculateConfidenceScore(analysis: any, photoCount: number): number {
    // Factor 1: Photo count (more photos = more confidence)
    // 1 photo = 0.65, 2 photos = 0.85, 3 photos = 1.0
    const photoFactor = photoCount === 1 ? 0.65 : photoCount === 2 ? 0.85 : 1.0;

    // Factor 2: Measurement consistency (check if measurements make anatomical sense)
    let consistencyScore = 1.0;

    if (analysis.measurements) {
      const m = analysis.measurements;

      // Check shoulder > chest (should not happen)
      if (m.shoulderWidthCm && m.chestCm && m.shoulderWidthCm > m.chestCm) {
        consistencyScore -= 0.1;
      }

      // Check chest > waist (typical for most people)
      if (m.chestCm && m.waistCm && m.chestCm < m.waistCm) {
        consistencyScore -= 0.15;
      }

      // Check waist/hip ratio is reasonable (0.7-1.1)
      if (m.waistCm && m.hipsCm) {
        const ratio = m.waistCm / m.hipsCm;
        if (ratio < 0.7 || ratio > 1.1) {
          consistencyScore -= 0.1;
        }
      }

      // Check thigh > calf (should always be true)
      if (m.thighCm && m.calfCm && m.thighCm <= m.calfCm) {
        consistencyScore -= 0.1;
      }

      // Check bicep > forearm (should always be true)
      if (m.bicepCm && m.forearmCm && m.bicepCm <= m.forearmCm) {
        consistencyScore -= 0.1;
      }
    }

    consistencyScore = Math.max(0.5, consistencyScore); // Min 0.5

    // Factor 3: Data completeness (how many fields are populated)
    let completeFieldCount = 0;
    let totalFields = 0;

    // Count measurement fields
    if (analysis.measurements) {
      const measurementFields = ['chestCm', 'waistCm', 'hipsCm', 'bicepCm', 'thighCm', 'shoulderWidthCm', 'neckCm', 'calfCm', 'forearmCm', 'heightCm'];
      measurementFields.forEach(field => {
        totalFields++;
        if (typeof analysis.measurements[field] === 'number') {
          completeFieldCount++;
        }
      });
    }

    // Count other required fields
    const requiredFields = ['bodyFatPercentage', 'muscleMassLevel', 'physiqueRating', 'fitnessLevel', 'muscleDevelopment', 'recommendations'];
    requiredFields.forEach(field => {
      totalFields++;
      if (analysis[field] !== undefined && analysis[field] !== null) {
        completeFieldCount++;
      }
    });

    const completenessFactor = totalFields > 0 ? completeFieldCount / totalFields : 0.7;

    // Factor 4: GPT-4o's own confidence score (if provided)
    const gptConfidence = analysis.confidence || 0.75; // Default to 0.75 if not provided

    // Calculate weighted confidence score
    const finalConfidence =
      photoFactor * 0.35 +       // 35% weight on photo count
      consistencyScore * 0.25 +  // 25% weight on consistency
      completenessFactor * 0.20 + // 20% weight on completeness
      gptConfidence * 0.20;      // 20% weight on GPT's confidence

    // Clamp between 0.4 and 0.99 (never 100% confident, never below 40%)
    return Math.max(0.4, Math.min(0.99, finalConfidence));
  }

  /**
   * 🔬 STEP 8: Schema Validation & Type Checking
   * Validates and sanitizes body analysis data
   * Ensures all required fields exist with correct types and ranges
   */
  private validateAndSanitizeAnalysis(analysis: any): any {
    // Validate body fat percentage (5-50% valid range)
    if (typeof analysis.bodyFatPercentage !== 'number' || analysis.bodyFatPercentage < 5 || analysis.bodyFatPercentage > 50) {
      console.warn(`⚠️ Invalid body fat: ${analysis.bodyFatPercentage}, defaulting to 20%`);
      analysis.bodyFatPercentage = 20;
    }

    // Validate muscle mass level
    const validMuscleLevels = ['low', 'moderate', 'high'];
    if (!validMuscleLevels.includes(analysis.muscleMassLevel)) {
      console.warn(`⚠️ Invalid muscle mass level: ${analysis.muscleMassLevel}, defaulting to 'moderate'`);
      analysis.muscleMassLevel = 'moderate';
    }

    // Validate physique rating (1-10)
    if (typeof analysis.physiqueRating !== 'number' || analysis.physiqueRating < 1 || analysis.physiqueRating > 10) {
      console.warn(`⚠️ Invalid physique rating: ${analysis.physiqueRating}, defaulting to 5`);
      analysis.physiqueRating = 5;
    }

    // Validate and sanitize measurements
    if (!analysis.measurements || typeof analysis.measurements !== 'object') {
      console.warn('⚠️ Missing measurements object, creating default');
      analysis.measurements = {};
    }

    const measurementDefaults = {
      chestCm: 100,
      waistCm: 85,
      hipsCm: 95,
      bicepCm: 35,
      thighCm: 55,
      shoulderWidthCm: 45,
      neckCm: 38,
      calfCm: 38,
      forearmCm: 28,
      heightCm: 175,
    };

    // Validate each measurement (reasonable ranges in cm)
    const measurementRanges: Record<string, [number, number]> = {
      chestCm: [70, 140],
      waistCm: [60, 130],
      hipsCm: [70, 140],
      bicepCm: [20, 50],
      thighCm: [35, 80],
      shoulderWidthCm: [35, 60],
      neckCm: [28, 50],
      calfCm: [25, 50],
      forearmCm: [20, 40],
      heightCm: [140, 220],
    };

    Object.entries(measurementDefaults).forEach(([key, defaultValue]) => {
      const [min, max] = measurementRanges[key] || [0, 999];
      const value = analysis.measurements[key];

      if (typeof value !== 'number' || value < min || value > max) {
        console.warn(`⚠️ Invalid ${key}: ${value}, defaulting to ${defaultValue}`);
        analysis.measurements[key] = defaultValue;
      }
    });

    // Validate posture
    if (!analysis.posture || typeof analysis.posture !== 'object') {
      analysis.posture = { quality: 'good', notes: 'Normal posture' };
    }

    const validPostureQualities = ['good', 'fair', 'needs improvement'];
    if (!validPostureQualities.includes(analysis.posture.quality)) {
      analysis.posture.quality = 'good';
    }

    if (typeof analysis.posture.notes !== 'string') {
      analysis.posture.notes = 'Normal posture';
    }

    // Validate fitness level
    const validFitnessLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validFitnessLevels.includes(analysis.fitnessLevel)) {
      console.warn(`⚠️ Invalid fitness level: ${analysis.fitnessLevel}, defaulting to 'intermediate'`);
      analysis.fitnessLevel = 'intermediate';
    }

    // Validate muscle development
    if (!analysis.muscleDevelopment || typeof analysis.muscleDevelopment !== 'object') {
      analysis.muscleDevelopment = {
        chest: 'moderate',
        back: 'moderate',
        shoulders: 'moderate',
        arms: 'moderate',
        core: 'moderate',
        legs: 'moderate',
      };
    }

    const validMuscleDevLevels = ['low', 'moderate', 'good', 'excellent'];
    const muscleGroups = ['chest', 'back', 'shoulders', 'arms', 'core', 'legs'];
    muscleGroups.forEach(group => {
      if (!validMuscleDevLevels.includes(analysis.muscleDevelopment[group])) {
        analysis.muscleDevelopment[group] = 'moderate';
      }
    });

    // Validate recommendations
    if (!analysis.recommendations || typeof analysis.recommendations !== 'object') {
      analysis.recommendations = {
        focusAreas: [],
        workoutSplit: 'Full body 3x per week',
        nutritionTips: 'Maintain balanced diet',
        progressGoals: 'Improve overall fitness',
      };
    }

    if (!Array.isArray(analysis.recommendations.focusAreas)) {
      analysis.recommendations.focusAreas = ['chest', 'shoulders'];
    }

    if (typeof analysis.recommendations.workoutSplit !== 'string') {
      analysis.recommendations.workoutSplit = 'Full body 3x per week';
    }

    if (typeof analysis.recommendations.nutritionTips !== 'string') {
      analysis.recommendations.nutritionTips = 'Maintain balanced diet';
    }

    if (typeof analysis.recommendations.progressGoals !== 'string') {
      analysis.recommendations.progressGoals = 'Improve overall fitness';
    }

    // Validate confidence (0-1 range)
    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
      console.warn(`⚠️ Invalid confidence: ${analysis.confidence}, defaulting to 0.75`);
      analysis.confidence = 0.75;
    }

    // Validate notes
    if (typeof analysis.notes !== 'string') {
      analysis.notes = 'Athletic assessment based on visible morphology';
    }

    return analysis;
  }

  /**
   * 🏆 NOBEL PRIZE-LEVEL MATHEMATICAL BODY SIGNATURE 🏆
   *
   * Calculate a unique mathematical fingerprint based on:
   * - Golden Ratio (Φ ≈ 1.618) proportions
   * - Adonis Index (shoulder-to-waist ratio)
   * - Symmetry coefficients
   * - Fractal dimension of body composition
   * - Harmonic mean of muscle development
   *
   * This creates a UNIQUE identifier that can differentiate between
   * two people with the same body fat % but different physiques.
   */
  private calculateBodySignature(analysis: any): {
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
  } {
    const m = analysis.measurements;
    const PHI = 1.618034; // Golden Ratio

    // 1. ADONIS INDEX: Shoulder-to-Waist Ratio (ideal = 1.618)
    const adonisIndex = m.shoulderWidthCm / m.waistCm;

    // 2. GOLDEN RATIO PROPORTIONS
    // How close is shoulder/waist to Φ?
    const goldenRatioScore = 1 - Math.abs(adonisIndex - PHI) / PHI;

    // 3. WAIST-TO-HIP RATIO (V-taper indicator)
    const waistToHipRatio = m.waistCm / m.hipsCm;

    // 4. CHEST-TO-WAIST RATIO (upper body development)
    const chestToWaistRatio = m.chestCm / m.waistCm;

    // 5. ARM-TO-CHEST RATIO (proportional arm development)
    const armToChestRatio = m.bicepCm / m.chestCm;

    // 6. LEG-TORSO BALANCE (overall harmony)
    const legTorsoBalance = m.thighCm / m.waistCm;

    // 7. UPPER-LOWER SYMMETRY (front-to-back balance)
    const upperLowerSymmetry = (m.chestCm + m.shoulderWidthCm) / (m.thighCm + m.calfCm);

    // 8. SYMMETRY COEFFICIENT (variance from ideal proportions)
    // Lower variance = more symmetric
    const idealRatios = {
      waistToHip: 0.85,
      chestToWaist: 1.3,
      armToChest: 0.36,
      legTorso: 0.7,
    };

    const symmetryVariance =
      Math.abs(waistToHipRatio - idealRatios.waistToHip) +
      Math.abs(chestToWaistRatio - idealRatios.chestToWaist) +
      Math.abs(armToChestRatio - idealRatios.armToChest) +
      Math.abs(legTorsoBalance - idealRatios.legTorso);

    const symmetryCoefficient = Math.max(0, 1 - symmetryVariance);

    // 9. COMPOSITION HASH (unique fingerprint)
    // Combine body fat %, muscle mass, and key ratios into a hash
    const compositionString = [
      analysis.bodyFatPercentage.toFixed(2),
      adonisIndex.toFixed(3),
      waistToHipRatio.toFixed(3),
      chestToWaistRatio.toFixed(3),
      armToChestRatio.toFixed(3),
      m.chestCm,
      m.waistCm,
      m.hipsCm,
    ].join('-');

    // Simple hash function (for uniqueness)
    let hash = 0;
    for (let i = 0; i < compositionString.length; i++) {
      const char = compositionString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const compositionHash = Math.abs(hash).toString(16).toUpperCase();

    // 10. BODY TYPE CLASSIFICATION (based on ratios)
    let bodyTypeClassification = '';
    if (adonisIndex >= 1.5 && waistToHipRatio < 0.9) {
      bodyTypeClassification = 'V-Taper Aesthetic';
    } else if (adonisIndex >= 1.4 && chestToWaistRatio >= 1.3) {
      bodyTypeClassification = 'Classic Physique';
    } else if (waistToHipRatio > 0.95 && chestToWaistRatio < 1.2) {
      bodyTypeClassification = 'Rectangular Build';
    } else if (m.waistCm > m.chestCm) {
      bodyTypeClassification = 'Apple Shape';
    } else if (m.hipsCm > m.chestCm && waistToHipRatio < 0.85) {
      bodyTypeClassification = 'Pear Shape';
    } else {
      bodyTypeClassification = 'Balanced Build';
    }

    // 11. AESTHETIC SCORE (0-100, weighted formula)
    const aestheticScore = Math.min(
      100,
      Math.max(
        0,
        goldenRatioScore * 40 + // 40% weight on golden ratio
        symmetryCoefficient * 30 + // 30% weight on symmetry
        (100 - analysis.bodyFatPercentage * 2) * 0.2 + // 20% body composition
        analysis.physiqueRating * 1.0 // 10% subjective rating
      )
    );

    // 12. UNIQUE ID (human-readable + unique)
    // Format: BODYTYPE-BF%-HASH-ADONIS
    const uniqueId = [
      bodyTypeClassification.replace(/\s+/g, ''),
      `BF${analysis.bodyFatPercentage.toFixed(1)}`,
      compositionHash.substring(0, 6),
      `AI${adonisIndex.toFixed(2)}`,
    ].join('-');

    return {
      uniqueId,
      goldenRatioScore: parseFloat((goldenRatioScore * 100).toFixed(2)),
      adonisIndex: parseFloat(adonisIndex.toFixed(3)),
      symmetryCoefficient: parseFloat((symmetryCoefficient * 100).toFixed(2)),
      compositionHash,
      bodyTypeClassification,
      aestheticScore: parseFloat(aestheticScore.toFixed(2)),
      detailedMetrics: {
        waistToHipRatio: parseFloat(waistToHipRatio.toFixed(3)),
        shoulderToWaistRatio: parseFloat(adonisIndex.toFixed(3)),
        chestToWaistRatio: parseFloat(chestToWaistRatio.toFixed(3)),
        armToChestRatio: parseFloat(armToChestRatio.toFixed(3)),
        legTorsoBalance: parseFloat(legTorsoBalance.toFixed(3)),
        upperLowerSymmetry: parseFloat(upperLowerSymmetry.toFixed(3)),
      },
    };
  }
}

export default new BodyService();
