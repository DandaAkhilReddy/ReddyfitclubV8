#!/bin/bash

# ReddyFit AI Coach - Automated Setup Script
# This script sets up the entire AI backend in one go

set -e  # Exit on error

echo "🚀 ReddyFit AI Coach - Automated Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file with your API keys."
    echo "See README.md for instructions."
    exit 1
fi

# Check if OpenAI API key is set
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo -e "${YELLOW}⚠️  Warning: OPENAI_API_KEY not found in .env${NC}"
    echo "You need an OpenAI API key for embeddings and image analysis."
    echo ""
    echo "Get your key here: https://platform.openai.com/api-keys"
    echo "Then add it to .env file: OPENAI_API_KEY=sk-your-key-here"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Step 1/5: Installing dependencies..."
npm install

echo ""
echo "🏗️  Step 2/5: Building TypeScript..."
npm run build

echo ""
echo "🌱 Step 3/5: Seeding Pinecone database..."
echo "This will upload your fitness knowledge base to vector database."
echo "It may take 30-60 seconds..."
npm run seed

echo ""
echo "✅ Step 4/5: Running health checks..."

# Start server in background for testing
echo "Starting server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Server is healthy!${NC}"
else
    echo -e "${RED}❌ Server health check failed${NC}"
    kill $SERVER_PID
    exit 1
fi

# Test API endpoint
echo "Testing meal analysis API..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/meal/analyze-description \
    -H "Content-Type: application/json" \
    -d '{"description": "Grilled chicken breast with rice and broccoli", "userId": "test"}')

if echo "$RESPONSE" | grep -q "nutrition"; then
    echo -e "${GREEN}✅ API is working!${NC}"
else
    echo -e "${RED}❌ API test failed${NC}"
    echo "Response: $RESPONSE"
    kill $SERVER_PID
    exit 1
fi

# Stop test server
kill $SERVER_PID
sleep 2

echo ""
echo "🎉 Step 5/5: Setup Complete!"
echo ""
echo "======================================"
echo -e "${GREEN}✅ ReddyFit AI Coach is ready!${NC}"
echo "======================================"
echo ""
echo "To start the server:"
echo "  npm run dev"
echo ""
echo "Server will run at: http://localhost:3001"
echo "Health check: http://localhost:3001/health"
echo ""
echo "📚 API Endpoints:"
echo "  POST /api/meal/analyze-image"
echo "  POST /api/meal/analyze-description"
echo "  POST /api/meal/calculate-goals"
echo "  POST /api/workout/generate"
echo "  POST /api/workout/recommendations"
echo ""
echo "📖 Documentation:"
echo "  Backend: ai-backend/README.md"
echo "  Complete Setup: ../REDDYFIT_AI_COMPLETE_SETUP.md"
echo ""
echo "💡 Next Steps:"
echo "  1. Start backend: npm run dev"
echo "  2. Start frontend: cd .. && npm run dev"
echo "  3. Visit: http://localhost:5173/ai-coach"
echo ""
echo "🎊 Happy coding!"
