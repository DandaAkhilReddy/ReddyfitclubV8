// Nutrition Analysis Service
import groqService from './groq.service';
import pineconeService from './pinecone.service';
import { NutritionData } from '../types';
import OpenAI from 'openai';

class NutritionService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Analyze meal from multiple images using GPT-4 Vision
   * (Groq doesn't support vision yet as of Jan 2025)
   */
  async analyzeMealFromImage(imageBase64Array: string | string[]): Promise<NutritionData> {
    try {
      // Support both single image (backwards compatible) and multiple images
      const images = Array.isArray(imageBase64Array) ? imageBase64Array : [imageBase64Array];
      const photoCount = images.length;

      // Build content array with text prompt + all images
      const contentArray: any[] = [
        {
          type: 'text',
          text: `You are an expert nutritionist. ${photoCount > 1 ?
            `Analyze ALL ${photoCount} photos of the same meal. These photos may show different angles, dishes, or items from the same meal.` :
            'Analyze this meal image and provide detailed nutritional information.'}

IMPORTANT:
${photoCount > 1 ?
  '- Look across ALL photos to identify all food items\n- Some photos may overlap or show the same items from different angles\n- Avoid double-counting items that appear in multiple photos\n- Combine your analysis into ONE comprehensive nutritional breakdown' :
  '- Identify all food items visible in the image'}

Identify all food items and estimate:
1. Portion sizes (be as accurate as possible)
2. Calories per item
3. Macronutrients (protein, carbs, fats, fiber)
4. Meal type (breakfast, lunch, dinner, snack)

Return your analysis as JSON in this exact format:
{
  "foodItems": [
    {
      "name": "Food name",
      "quantity": "Estimated quantity (e.g., 1 cup, 200g)",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fats": 0,
      "confidence": 0.85
    }
  ],
  "totalCalories": 0,
  "macros": {
    "protein": 0,
    "carbs": 0,
    "fats": 0,
    "fiber": 0
  },
  "mealType": "lunch",
  "confidence": 0.8
}`,
        },
      ];

      // Add all images to the content array
      images.forEach((imageBase64, index) => {
        contentArray.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: 'high', // Request high-detail analysis
          },
        });
      });

      console.log(`🔍 Sending ${photoCount} photo${photoCount > 1 ? 's' : ''} to GPT-4o Vision for analysis...`);

      // Use GPT-4o (with vision) for multi-image analysis in ONE API call
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // ✅ Already using gpt-4o (not deprecated gpt-4-vision-preview)
        messages: [
          {
            role: 'user',
            content: contentArray,
          },
        ],
        max_tokens: 1500, // Increased for multiple photos
      });

      const content = response.choices[0].message.content || '{}';

      // Multi-Strategy JSON Extraction (same as body.service.ts)
      let nutritionData: NutritionData;

      try {
        // Strategy 1: Plain JSON
        nutritionData = JSON.parse(content.trim());
      } catch (e1) {
        try {
          // Strategy 2: Markdown JSON block
          const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonBlockMatch) {
            nutritionData = JSON.parse(jsonBlockMatch[1].trim());
          } else {
            throw new Error('No markdown json block');
          }
        } catch (e2) {
          try {
            // Strategy 3: Markdown code block
            const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
              nutritionData = JSON.parse(codeBlockMatch[1].trim());
            } else {
              throw new Error('No markdown code block');
            }
          } catch (e3) {
            try {
              // Strategy 4: Brace extraction
              const firstBrace = content.indexOf('{');
              const lastBrace = content.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1) {
                nutritionData = JSON.parse(content.substring(firstBrace, lastBrace + 1));
              } else {
                throw new Error('No JSON braces found');
              }
            } catch (e4) {
              console.error('❌ All JSON extraction strategies failed for nutrition analysis');
              console.error('Response:', content);
              throw new Error('Could not extract JSON from vision API response');
            }
          }
        }
      }

      console.log(`✅ GPT-4 Vision analysis complete: ${nutritionData.totalCalories} cal, ${nutritionData.foodItems.length} items identified`);

      return nutritionData;
    } catch (error) {
      console.error('Vision API Error:', error);

      // Fallback: Use Groq with manual description
      return this.analyzeMealFromDescription(
        'Unable to analyze images. Please provide meal description.'
      );
    }
  }

  /**
   * Analyze meal from text description (fallback or alternative)
   */
  async analyzeMealFromDescription(description: string): Promise<NutritionData> {
    try {
      // Get nutrition knowledge from RAG
      const context = await pineconeService.getContext(
        `nutrition information for: ${description}`,
        3
      );

      const systemPrompt = `You are an expert nutritionist. Using the following knowledge base and your expertise, analyze the meal description.

KNOWLEDGE BASE:
${context}

Provide detailed nutritional breakdown as JSON.`;

      const userPrompt = `Analyze this meal: "${description}"

Return JSON with this structure:
{
  "foodItems": [...],
  "totalCalories": 0,
  "macros": { "protein": 0, "carbs": 0, "fats": 0, "fiber": 0 },
  "mealType": "lunch",
  "confidence": 0.75
}`;

      const nutritionData = await groqService.generateStructuredResponse<NutritionData>(
        systemPrompt,
        userPrompt
      );

      return nutritionData;
    } catch (error) {
      console.error('Nutrition Analysis Error:', error);
      throw new Error('Failed to analyze meal');
    }
  }

  /**
   * Get AI insights about the meal
   */
  async getMealInsights(nutrition: NutritionData): Promise<string> {
    const prompt = `Given this meal's nutrition:
- Calories: ${nutrition.totalCalories}
- Protein: ${nutrition.macros.protein}g
- Carbs: ${nutrition.macros.carbs}g
- Fats: ${nutrition.macros.fats}g

Provide 2-3 sentence insights about:
1. Is this a balanced meal?
2. What could be improved?
3. How does it fit into a fitness diet?

Keep it concise and actionable.`;

    return groqService.chat([
      {
        role: 'system',
        content: 'You are a fitness nutrition coach. Provide brief, actionable insights.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);
  }

  /**
   * Calculate daily nutrition goals based on user profile
   */
  calculateDailyGoals(userProfile: {
    weight: number; // kg
    height: number; // cm
    age: number;
    gender: 'male' | 'female';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    goal: 'lose_weight' | 'maintain' | 'gain_muscle';
  }): {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } {
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number;
    if (userProfile.gender === 'male') {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age + 5;
    } else {
      bmr = 10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    let tdee = bmr * activityMultipliers[userProfile.activityLevel];

    // Adjust for goals
    if (userProfile.goal === 'lose_weight') {
      tdee -= 500; // 500 calorie deficit
    } else if (userProfile.goal === 'gain_muscle') {
      tdee += 300; // 300 calorie surplus
    }

    // Macro split (40% carbs, 30% protein, 30% fats for muscle gain)
    const protein = (tdee * 0.3) / 4; // 4 cal per gram
    const carbs = (tdee * 0.4) / 4;
    const fats = (tdee * 0.3) / 9; // 9 cal per gram

    return {
      calories: Math.round(tdee),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
    };
  }
}

export default new NutritionService();
