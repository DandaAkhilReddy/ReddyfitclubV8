// Main AI Coach Dashboard
import { useState } from 'react';
import MealUpload from './MealUpload';
import NutritionAnalysis from './NutritionAnalysis';
import WorkoutSuggestion from './WorkoutSuggestion';
import aiApi, { AICoachResponse } from '../../services/ai-api';
import './AICoach.css';

export default function AICoachDashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AICoachResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');

  // Meal description input
  const [mealDescription, setMealDescription] = useState('');

  // Get user ID from auth context (placeholder - adjust based on your auth system)
  const userId = 'user123'; // TODO: Get from your auth context

  const handleImageAnalysis = async (imageFile: File) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📸 Analyzing meal image...');
      const response = await aiApi.analyzeMealFromImage(imageFile, userId);

      setResult(response);
      console.log('✅ Analysis complete!', response);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.message || 'Failed to analyze meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalysis = async () => {
    if (!mealDescription.trim()) {
      setError('Please enter a meal description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 Analyzing meal description...');
      const response = await aiApi.analyzeMealFromDescription(mealDescription, userId);

      setResult(response);
      console.log('✅ Analysis complete!', response);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.message || 'Failed to analyze meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setError(null);
    setMealDescription('');
  };

  return (
    <div className="ai-coach-dashboard">
      <header className="dashboard-header">
        <h1>🤖 AI Fitness Coach</h1>
        <p className="dashboard-subtitle">
          Upload your meal photo and get instant nutrition analysis + personalized workout plan
        </p>
      </header>

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
