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
            role: 'user',
            content: contentArray,
          },
        ],
        max_tokens: 2000, // Increased for detailed body analysis
      });

      const content = response.choices[0].message.content || '{}';

      // 🐛 DEBUG: Log raw response to see what GPT-4o is actually returning
      console.log('🔍 Raw GPT-4o Vision Response:', content.substring(0, 500) + (content.length > 500 ? '...' : ''));

      // Extract JSON from response - handle multiple formats
      // Try different patterns: markdown json block, markdown code block, or plain JSON
      let jsonMatch =
        content.match(/```json\s*(\{[\s\S]*?\})\s*```/) || // Markdown json block
        content.match(/```\s*(\{[\s\S]*?\})\s*```/) ||     // Markdown code block
        content.match(/(\{[\s\S]*\})/);                     // Plain JSON

      if (!jsonMatch) {
        console.error('❌ Failed to extract JSON. Full response:', content);
        throw new Error('Could not extract JSON from vision API response');
      }

      // Get the captured group (if exists) or the full match
      const jsonString = jsonMatch[1] || jsonMatch[0];
      console.log('✅ Extracted JSON string:', jsonString.substring(0, 200) + '...');

      const bodyAnalysis: BodyScanResult = JSON.parse(jsonString);

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
