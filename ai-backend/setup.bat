@echo off
REM ReddyFit AI Coach - Windows Setup Script
REM This script sets up the entire AI backend in one go

echo ========================================
echo   ReddyFit AI Coach - Automated Setup
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please create .env file with your API keys.
    echo See README.md for instructions.
    pause
    exit /b 1
)

REM Check if OpenAI API key is set
findstr /C:"OPENAI_API_KEY=sk-" .env >nul
if errorlevel 1 (
    echo [WARNING] OPENAI_API_KEY not found in .env
    echo You need an OpenAI API key for embeddings and image analysis.
    echo.
    echo Get your key here: https://platform.openai.com/api-keys
    echo Then add it to .env file: OPENAI_API_KEY=sk-your-key-here
    echo.
    set /p CONTINUE="Do you want to continue anyway? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 1
)

echo.
echo [1/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Building TypeScript...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo.
echo [3/5] Seeding Pinecone database...
echo This will upload your fitness knowledge base to vector database.
echo It may take 30-60 seconds...
call npm run seed
if errorlevel 1 (
    echo [ERROR] Seeding failed
    pause
    exit /b 1
)

echo.
echo [4/5] Running health checks...
echo Starting server for testing...

REM Start server in background
start /B npm run dev

REM Wait for server to start
timeout /t 5 /nobreak >nul

REM Test health endpoint
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Server health check failed
    taskkill /F /IM node.exe >nul 2>&1
    pause
    exit /b 1
)
echo [OK] Server is healthy!

REM Test API endpoint
echo Testing meal analysis API...
curl -s -X POST http://localhost:3001/api/meal/analyze-description ^
    -H "Content-Type: application/json" ^
    -d "{\"description\": \"Grilled chicken breast with rice and broccoli\", \"userId\": \"test\"}" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] API test failed
    taskkill /F /IM node.exe >nul 2>&1
    pause
    exit /b 1
)
echo [OK] API is working!

REM Stop test server
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [5/5] Setup Complete!
echo.
echo ========================================
echo    ReddyFit AI Coach is ready!
echo ========================================
echo.
echo To start the server:
echo   npm run dev
echo.
echo Server will run at: http://localhost:3001
echo Health check: http://localhost:3001/health
echo.
echo API Endpoints:
echo   POST /api/meal/analyze-image
echo   POST /api/meal/analyze-description
echo   POST /api/meal/calculate-goals
echo   POST /api/workout/generate
echo   POST /api/workout/recommendations
echo.
echo Documentation:
echo   Backend: ai-backend\README.md
echo   Complete Setup: ..\REDDYFIT_AI_COMPLETE_SETUP.md
echo.
echo Next Steps:
echo   1. Start backend: npm run dev
echo   2. Start frontend: cd .. ^&^& npm run dev
echo   3. Visit: http://localhost:5173/ai-coach
echo.
echo Happy coding!
echo.

pause
