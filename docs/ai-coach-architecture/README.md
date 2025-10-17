# AI Coach Meal Analysis Architecture

## Overview
The AI Coach feature allows users to upload up to 10 meal photos, which are analyzed by GPT-4 Vision to provide:
- Detailed nutrition breakdown (calories, protein, carbs, fats, fiber)
- Individual food item identification
- Personalized workout suggestions based on meal energy
- AI-powered coaching insights

## Architecture Diagram

```
┌─────────────────┐
│   User          │
│   (Browser)     │
└────────┬────────┘
         │ Upload photos (1-10)
         ▼
┌─────────────────────────────────────────────────┐
│         Frontend (React + TypeScript)           │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  AICoachDashboard.tsx                    │  │
│  │  - Main orchestration component          │  │
│  │  - Manages upload/text tabs              │  │
│  │  - Displays results                      │  │
│  └─────────────┬────────────────────────────┘  │
│                │                                 │
│  ┌─────────────▼────────────────────────────┐  │
│  │  MealUpload.tsx                          │  │
│  │  - Multi-photo upload (up to 10)         │  │
│  │  - Camera capture                        │  │
│  │  - Photo preview grid                    │  │
│  │  - FileReader → Base64 conversion        │  │
│  └─────────────┬────────────────────────────┘  │
│                │                                 │
│  ┌─────────────▼────────────────────────────┐  │
│  │  ai-api.ts                               │  │
│  │  - API client with axios                 │  │
│  │  - Converts File[] → Base64[]            │  │
│  │  - POST to backend                       │  │
│  └─────────────┬────────────────────────────┘  │
└────────────────┼─────────────────────────────────┘
                 │ HTTP POST
                 │ /api/meal/analyze-image
                 │ { imageBase64Array, userId }
                 ▼
┌─────────────────────────────────────────────────┐
│      Backend (Express + TypeScript)             │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  meal.controller.ts                      │  │
│  │  - Receives base64 image array           │  │
│  │  - Validates input                       │  │
│  │  - Calls nutrition service               │  │
│  └─────────────┬────────────────────────────┘  │
│                │                                 │
│  ┌─────────────▼────────────────────────────┐  │
│  │  nutrition.service.ts                    │  │
│  │  - Core AI analysis logic                │  │
│  │  - Sends ALL images in ONE API call      │  │
│  │  - Processes GPT-4 Vision response       │  │
│  └─────────────┬────────────────────────────┘  │
└────────────────┼─────────────────────────────────┘
                 │ OpenAI API call
                 │ model: gpt-4-vision-preview
                 │ content: [text + image_url × N]
                 ▼
┌─────────────────────────────────────────────────┐
│           OpenAI GPT-4 Vision API               │
│                                                  │
│  - Analyzes all photos simultaneously           │
│  - Identifies food items across images          │
│  - Avoids double-counting                       │
│  - Returns structured JSON:                     │
│    {                                             │
│      foodItems: [...],                          │
│      totalCalories: 0,                          │
│      macros: { protein, carbs, fats, fiber },   │
│      mealType: "lunch",                         │
│      confidence: 0.85                           │
│    }                                             │
└─────────────────────────────────────────────────┘
```

## Data Flow

### 1. **Photo Upload (Frontend)**
```typescript
User selects photos → FileReader converts to base64 → State updates → Photos displayed in grid
```

### 2. **Analysis Request**
```typescript
User clicks "Analyze" → aiApi.analyzeMealFromImage(files, userId)
                      → POST /api/meal/analyze-image with { imageBase64Array, userId }
```

### 3. **Backend Processing**
```typescript
meal.controller receives request
  → nutrition.service.analyzeMealFromImage(images)
  → OpenAI API call with all images
  → Parse JSON response
  → workout.service.generateWorkoutFromMeal(nutrition)
  → Return complete AICoachResponse
```

### 4. **Display Results**
```typescript
Frontend receives AICoachResponse
  → Display nutrition breakdown
  → Show food items with confidence scores
  → Display suggested workout
  → Show AI insights
```

## Key Files

| File | Purpose | Location |
|------|---------|----------|
| `AICoachDashboard.tsx` | Main UI component | `src/components/AICoach/` |
| `MealUpload.tsx` | Photo upload & camera | `src/components/AICoach/` |
| `ai-api.ts` | Frontend API client | `src/services/` |
| `meal.controller.ts` | Backend API endpoints | `ai-backend/src/controllers/` |
| `nutrition.service.ts` | GPT-4 Vision integration | `ai-backend/src/services/` |
| `workout.service.ts` | Workout generation | `ai-backend/src/services/` |

## Technologies

- **Frontend**: React, TypeScript, Vite
- **Backend**: Express, TypeScript
- **AI**: OpenAI GPT-4 Vision API
- **File Handling**: FileReader API, Canvas API (for camera)
- **State Management**: React useState, useCallback

## API Contracts

See individual function documentation files for detailed API contracts:
- [MealUpload Component API](./MealUpload.md)
- [Nutrition Service API](./nutrition-service.md)
- [Backend API Endpoints](./api-endpoints.md)

## Performance Optimizations

1. **useCallback Memoization**: All callback functions are memoized to prevent unnecessary re-renders
2. **Single API Call**: All photos sent in ONE GPT-4 Vision call (not separate calls)
3. **Promise.all**: FileReader operations processed in parallel
4. **High-detail analysis**: GPT-4 Vision uses `detail: 'high'` for better accuracy

## Next Steps

- See [MealUpload.md](./MealUpload.md) for upload component details
- See [nutrition-service.md](./nutrition-service.md) for GPT-4 Vision logic
- See [api-endpoints.md](./api-endpoints.md) for backend API documentation
