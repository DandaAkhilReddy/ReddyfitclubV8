# 🤖 ReddyFit AI Coach Backend

AI-powered fitness coach using RAG (Retrieval-Augmented Generation) with Groq + Pinecone.

## 🎯 Features

- **Meal Analysis from Photos**: Upload meal images, get instant nutrition breakdown
- **AI Workout Generation**: Personalized workout plans based on meals
- **RAG-Powered Knowledge**: Uses vector database for fitness expertise
- **Cost-Effective**: $0-50/month for thousands of users using free tiers

## 📦 Tech Stack

- **LLM**: Groq (Llama 3.1 8B Instant) - Ultra-fast, dirt cheap
- **Vision**: OpenAI GPT-4 Vision (for meal photo analysis)
- **Vector DB**: Pinecone (for RAG knowledge base)
- **Backend**: Express + TypeScript
- **Embeddings**: OpenAI text-embedding-3-small ($0.0001/1K tokens)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ai-backend
npm install
```

### 2. Setup Environment Variables

Create `.env` file (already created with your keys):

```env
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
PINECONE_API_KEY=YOUR_PINECONE_API_KEY_HERE
OPENAI_API_KEY=your_openai_key_here  # Get from https://platform.openai.com/api-keys
PORT=3001
```

**Important**: You need to sign up for a free OpenAI API key for embeddings:
1. Go to https://platform.openai.com/signup
2. Add $5 credit (embeddings are super cheap: ~$0.10 for 100K searches)
3. Copy API key to `.env`

### 3. Seed Pinecone Database

This uploads your fitness knowledge to the vector database:

```bash
npm run seed
```

Expected output:
```
🌱 Starting Pinecone seed process...
📊 Step 1: Creating Pinecone index...
✅ Index ready
⏳ Waiting 10 seconds for index initialization...
📚 Step 3: Uploading fitness knowledge...
Total items to upload: 20
✅ Successfully uploaded all knowledge
🔍 Step 4: Testing RAG search...
✨ Seed complete! Your AI coach is ready.
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at http://localhost:3001

### 5. Test the API

#### Health Check
```bash
curl http://localhost:3001/health
```

#### Analyze Meal (Text Description)
```bash
curl -X POST http://localhost:3001/api/meal/analyze-description \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Grilled chicken breast with rice and broccoli",
    "userId": "test123"
  }'
```

#### Generate Custom Workout
```bash
curl -X POST http://localhost:3001/api/workout/generate \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "strength",
    "duration": 45,
    "equipment": ["dumbbells", "barbell"],
    "experience": "intermediate",
    "targetMuscles": ["chest", "back"]
  }'
```

## 📚 API Endpoints

### Meal Analysis

#### `POST /api/meal/analyze-image`
Analyze meal from base64 image.

**Request:**
```json
{
  "imageBase64": "base64_string_here",
  "userId": "user123"
}
```

**Response:**
```json
{
  "nutrition": {
    "foodItems": [...],
    "totalCalories": 650,
    "macros": { "protein": 52, "carbs": 48, "fats": 16, "fiber": 8 }
  },
  "suggestedWorkout": {
    "title": "Upper Body Strength",
    "exercises": [...]
  },
  "aiInsights": "This is a well-balanced meal..."
}
```

#### `POST /api/meal/analyze-description`
Analyze meal from text description.

#### `POST /api/meal/upload-image`
Upload meal image as multipart form data.

#### `POST /api/meal/calculate-goals`
Calculate daily nutrition goals based on user profile.

### Workout Generation

#### `POST /api/workout/generate`
Generate personalized workout plan.

#### `POST /api/workout/recommendations`
Get smart recommendations based on time and meal timing.

#### `POST /api/workout/calculate-calories`
Calculate calories burned during workout.

## 🏗️ Project Structure

```
ai-backend/
├── src/
│   ├── index.ts                  # Main server
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── services/
│   │   ├── groq.service.ts       # Groq LLM API
│   │   ├── pinecone.service.ts   # Vector database
│   │   ├── nutrition.service.ts  # Meal analysis
│   │   └── workout.service.ts    # Workout generation
│   ├── controllers/
│   │   ├── meal.controller.ts    # Meal API endpoints
│   │   └── workout.controller.ts # Workout API endpoints
│   └── data/
│       ├── fitness-knowledge.json # Knowledge base
│       └── seed-pinecone.ts       # Database seeder
├── .env                           # Environment variables
├── package.json
└── tsconfig.json
```

## 💰 Cost Analysis

### Free Tier (First Month)
- **Groq**: 14,400 requests/day FREE
- **Pinecone**: 1 index, 100K vectors FREE
- **OpenAI Embeddings**: ~$0.10 for 100K searches
- **Total**: ~$0-10/month for small user base

### Production (10,000 users, 5 requests/user/day)
- **Groq**: $0.05/M tokens × 50K requests = ~$200/month
- **Pinecone**: $70/month (starter plan)
- **OpenAI Embeddings**: ~$50/month
- **Total**: ~$320/month
- **With caching optimization**: $100-150/month

### Cost Optimization Tips
1. **Cache common queries** (reduce API calls 50-70%)
2. **Use Groq free tier** (14,400 requests/day = 432K/month free!)
3. **Batch RAG searches** (reduce embedding calls)
4. **Compress images** (faster uploads, lower bandwidth)
5. **Add response timeout** (prevent hanging requests)

## 🔧 Configuration

### Groq Models Available
- `llama-3.1-8b-instant` (Recommended - super fast, cheap)
- `llama-3.1-70b-versatile` (Better quality, slower)
- `mixtral-8x7b-32768` (Good balance)

### Pinecone Index Settings
- **Dimension**: 1536 (OpenAI embedding size)
- **Metric**: cosine
- **Cloud**: AWS us-east-1 (fastest)

### OpenAI Models
- **Embeddings**: text-embedding-3-small
- **Vision**: gpt-4-vision-preview

## 🚀 Deployment

### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Render
```bash
# Create render.yaml
services:
  - type: web
    name: reddyfit-ai-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
```

### Option 3: Fly.io
```bash
fly launch
fly secrets set GROQ_API_KEY=xxx PINECONE_API_KEY=xxx OPENAI_API_KEY=xxx
fly deploy
```

## 📈 Scaling Strategy

### Phase 1: MVP (0-1K users)
- Use FREE tiers (Groq, Pinecone, minimal OpenAI)
- Cost: $0-20/month

### Phase 2: Growth (1K-10K users)
- Add Redis caching
- Upgrade Pinecone to Starter ($70/month)
- Cost: $100-300/month

### Phase 3: Scale (10K+ users)
- Self-host inference on Modal/RunPod ($0.34/hr GPU)
- Fine-tune custom models
- Cost: $500-1,000/month

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual Testing
Use the provided curl commands or import `api-tests.http` file into VS Code REST Client extension.

## 🐛 Troubleshooting

### "OPENAI_API_KEY is not set"
- Sign up at https://platform.openai.com
- Add $5 credit (lasts months for embeddings)
- Set in `.env` file

### "Failed to create Pinecone index"
- Verify your Pinecone API key
- Check if index already exists: https://app.pinecone.io
- Free tier allows 1 index only

### "Groq rate limit exceeded"
- Free tier: 14,400 requests/day
- Paid tier: https://console.groq.com/settings/limits
- Add caching to reduce API calls

### Vision API errors
- GPT-4 Vision requires paid OpenAI account
- Add $5 credit: https://platform.openai.com/account/billing
- Alternative: Use text descriptions instead of images

## 📝 Adding More Knowledge

Edit `src/data/fitness-knowledge.json`:

```json
{
  "id": "ex-newexercise-001",
  "type": "exercise",
  "content": "Detailed exercise description with form cues...",
  "metadata": {
    "muscle": "legs",
    "difficulty": "beginner",
    "equipment": ["bodyweight"]
  }
}
```

Then re-seed:
```bash
npm run seed
```

## 🤝 Contributing

1. Add new endpoints in controllers
2. Enhance AI prompts in services
3. Expand fitness knowledge base
4. Optimize costs with caching

## 📞 Support

Issues? Check:
- Groq Console: https://console.groq.com
- Pinecone Dashboard: https://app.pinecone.io
- OpenAI Platform: https://platform.openai.com

## 📄 License

MIT

---

**Built with ❤️ for ReddyFit | Powered by Groq + Pinecone**
