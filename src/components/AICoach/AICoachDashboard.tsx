// Main AI Coach Dashboard
import { useState, useCallback } from 'react';
import MealUpload from './MealUpload';
import NutritionAnalysis from './NutritionAnalysis';
import WorkoutSuggestion from './WorkoutSuggestion';
import TrialBanner from './TrialBanner';
import type { AICoachResponse } from '../../services/ai-api';
import aiApi from '../../services/ai-api';
import { useAICoachAccess } from '../../hooks/useAICoachAccess';
import { useAuth } from '../../hooks/useAuth';
import './AICoach.css';

export default function AICoachDashboard() {
  const { user, userProfile } = useAuth();
  const { isInTrial, daysRemaining, usageCount, usageLimit, usagePercentage, canUse, recordUsage } =
    useAICoachAccess();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AICoachResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');

  // Meal description input
  const [mealDescription, setMealDescription] = useState('');

  // Get user ID from auth
  const userId = user?.uid || 'guest';

  const handleImageAnalysis = useCallback(async (imageFiles: File[]) => {
    console.log('🔍 [AICoachDashboard] handleImageAnalysis called with', imageFiles.length, 'files');

    // Check if user can use AI Coach
    if (!canUse) {
      setError(
        `You've reached your AI Coach limit (${usageLimit} analyses/month). Upgrade your plan for more!`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const photoCount = imageFiles.length;
      console.log(`📸 Analyzing ${photoCount} meal photo${photoCount > 1 ? 's' : ''}...`);
      const response = await aiApi.analyzeMealFromImage(imageFiles, userId);
      console.log('✅ [AICoachDashboard] API response received:', response);

      // Record usage - but don't fail the entire flow if this fails
      try {
        console.log('🔍 [AICoachDashboard] Recording usage...');
        await recordUsage();
        console.log('✅ [AICoachDashboard] Usage recorded successfully');
      } catch (usageErr: any) {
        console.error('⚠️ [AICoachDashboard] Failed to record usage:', usageErr);
        // Don't throw - still show the result to the user
      }

      setResult(response);
      console.log('✅ Analysis complete!', response);
    } catch (err: any) {
      console.error('❌ [AICoachDashboard] Analysis failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to analyze meal';
      setError(`Analysis failed: ${errorMessage}. Please try again or use text description instead.`);
    } finally {
      setLoading(false);
    }
  }, [canUse, usageLimit, userId, recordUsage]);

  const handleTextAnalysis = useCallback(async () => {
    if (!mealDescription.trim()) {
      setError('Please enter a meal description');
      return;
    }

    console.log('🔍 [AICoachDashboard] handleTextAnalysis called');

    // Check if user can use AI Coach
    if (!canUse) {
      setError(
        `You've reached your AI Coach limit (${usageLimit} analyses/month). Upgrade your plan for more!`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 Analyzing meal description...');
      const response = await aiApi.analyzeMealFromDescription(mealDescription, userId);
      console.log('✅ [AICoachDashboard] API response received:', response);

      // Record usage - but don't fail the entire flow if this fails
      try {
        console.log('🔍 [AICoachDashboard] Recording usage...');
        await recordUsage();
        console.log('✅ [AICoachDashboard] Usage recorded successfully');
      } catch (usageErr: any) {
        console.error('⚠️ [AICoachDashboard] Failed to record usage:', usageErr);
        // Don't throw - still show the result to the user
      }

      setResult(response);
      console.log('✅ Analysis complete!', response);
    } catch (err: any) {
      console.error('❌ [AICoachDashboard] Analysis failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to analyze meal';
      setError(`Analysis failed: ${errorMessage}. Please try again or use text description instead.`);
    } finally {
      setLoading(false);
    }
  }, [canUse, usageLimit, mealDescription, userId, recordUsage]);

  const handleNewAnalysis = useCallback(() => {
    setResult(null);
    setError(null);
    setMealDescription('');
  }, []);

  return (
    <div className="ai-coach-dashboard">
      <header className="dashboard-header">
        <h1>🤖 AI Fitness Coach</h1>
        <p className="dashboard-subtitle">
          Upload or capture up to 10 meal photos for accurate nutrition analysis + personalized workout plan
        </p>
      </header>

      {/* Trial Banner */}
      {userProfile && (
        <TrialBanner
          isInTrial={isInTrial}
          daysRemaining={daysRemaining}
          usageCount={usageCount}
          usageLimit={usageLimit}
          usagePercentage={usagePercentage}
          subscription={userProfile.subscription}
        />
      )}

      {!result ? (
        <div className="input-section">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              📸 Upload Photo
            </button>
            <button
              className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              ✍️ Describe Meal
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <MealUpload onAnalyze={handleImageAnalysis} loading={loading} />
          )}

          {/* Text Input Tab */}
          {activeTab === 'text' && (
            <div className="text-input-container">
              <h2>✍️ Describe Your Meal</h2>
              <p className="subtitle">Enter what you ate and we'll analyze the nutrition</p>

              <textarea
                className="meal-description-input"
                placeholder="e.g., Grilled chicken breast with brown rice and broccoli, side salad with olive oil dressing"
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                rows={5}
                disabled={loading}
              />

              <button
                className="analyze-button primary"
                onClick={handleTextAnalysis}
                disabled={loading || !mealDescription.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Analyzing...
                  </>
                ) : (
                  '🤖 Analyze with AI'
                )}
              </button>

              <div className="info-box">
                <strong>💡 Tip:</strong> Be specific about:
                <ul>
                  <li>Type of food (e.g., grilled vs fried)</li>
                  <li>Approximate portions (cup, oz, etc.)</li>
                  <li>Ingredients and toppings</li>
                  <li>Cooking methods</li>
                </ul>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button className="error-close" onClick={() => setError(null)}>
                ✕
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="results-section">
          {/* Results Header */}
          <div className="results-header">
            <h2>🎉 Analysis Complete!</h2>
            <button className="new-analysis-button" onClick={handleNewAnalysis}>
              📸 Analyze Another Meal
            </button>
          </div>

          {/* Nutrition Analysis */}
          <NutritionAnalysis
            nutrition={result.nutrition}
            insights={result.aiInsights}
          />

          {/* Suggested Workout */}
          <WorkoutSuggestion
            workout={result.suggestedWorkout}
            onStartWorkout={() => {
              alert('Starting workout! (Integrate with your workout tracker)');
              // TODO: Integrate with your existing workout tracking system
            }}
          />

          {/* Timestamp */}
          <div className="analysis-footer">
            <small>
              Analysis completed at {new Date(result.timestamp).toLocaleString()}
            </small>
          </div>
        </div>
      )}

      {/* Features Overview (when no result) */}
      {!result && !loading && (
        <div className="features-section">
          <h3>✨ What You'll Get</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h4>Nutrition Analysis</h4>
              <p>Detailed breakdown of calories, protein, carbs, fats, and more</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💪</div>
              <h4>Workout Suggestion</h4>
              <p>Personalized workout plan matched to your meal's energy</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h4>AI Insights</h4>
              <p>Expert coaching tips for optimal fitness results</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h4>Instant Results</h4>
              <p>Get your analysis in seconds, powered by advanced AI</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
