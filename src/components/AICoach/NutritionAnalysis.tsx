// Nutrition Analysis Display Component
import type { NutritionData } from '../../services/ai-api';
import './AICoach.css';

interface NutritionAnalysisProps {
  nutrition: NutritionData;
  insights?: string;
}

export default function NutritionAnalysis({ nutrition, insights }: NutritionAnalysisProps) {
  const { foodItems, totalCalories, macros, mealType, confidence } = nutrition;

  return (
    <div className="nutrition-analysis">
      <div className="analysis-header">
        <h3>🍽️ Nutrition Analysis</h3>
        <span className="confidence-badge">
          {(confidence * 100).toFixed(0)}% confidence
        </span>
      </div>

      {mealType && (
        <div className="meal-type-badge">{mealType.replace('_', ' ').toUpperCase()}</div>
      )}

      {/* Total Calories */}
      <div className="calories-card">
        <div className="calories-display">
          <span className="calories-number">{totalCalories}</span>
          <span className="calories-label">calories</span>
        </div>
      </div>

      {/* Macros Overview */}
      <div className="macros-grid">
        <div className="macro-card protein">
          <div className="macro-icon">🥩</div>
          <div className="macro-value">{macros.protein}g</div>
          <div className="macro-label">Protein</div>
          <div className="macro-percent">
            {((macros.protein * 4 / totalCalories) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="macro-card carbs">
          <div className="macro-icon">🍚</div>
          <div className="macro-value">{macros.carbs}g</div>
          <div className="macro-label">Carbs</div>
          <div className="macro-percent">
            {((macros.carbs * 4 / totalCalories) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="macro-card fats">
          <div className="macro-icon">🥑</div>
          <div className="macro-value">{macros.fats}g</div>
          <div className="macro-label">Fats</div>
          <div className="macro-percent">
            {((macros.fats * 9 / totalCalories) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="macro-card fiber">
          <div className="macro-icon">🌾</div>
          <div className="macro-value">{macros.fiber}g</div>
          <div className="macro-label">Fiber</div>
        </div>
      </div>

      {/* Food Items Breakdown */}
      <div className="food-items-section">
        <h4>📋 Detected Food Items</h4>
        <div className="food-items-list">
          {foodItems.map((item, index) => (
            <div key={index} className="food-item">
              <div className="food-item-header">
                <span className="food-name">{item.name}</span>
                <span className="food-calories">{item.calories} cal</span>
              </div>
              <div className="food-quantity">{item.quantity}</div>
              <div className="food-macros">
                <span>P: {item.protein}g</span>
                <span>C: {item.carbs}g</span>
                <span>F: {item.fats}g</span>
              </div>
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{ width: `${item.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      {insights && (
        <div className="ai-insights">
          <h4>💡 AI Coach Insights</h4>
          <p>{insights}</p>
        </div>
      )}

      {/* Macro Chart */}
      <div className="macro-chart">
        <h4>Macronutrient Distribution</h4>
        <div className="chart-bar">
          <div
            className="chart-segment protein-segment"
            style={{ width: `${(macros.protein * 4 / totalCalories) * 100}%` }}
            title={`Protein: ${((macros.protein * 4 / totalCalories) * 100).toFixed(1)}%`}
          >
            <span className="segment-label">
              {((macros.protein * 4 / totalCalories) * 100).toFixed(0)}%
            </span>
          </div>
          <div
            className="chart-segment carbs-segment"
            style={{ width: `${(macros.carbs * 4 / totalCalories) * 100}%` }}
            title={`Carbs: ${((macros.carbs * 4 / totalCalories) * 100).toFixed(1)}%`}
          >
            <span className="segment-label">
              {((macros.carbs * 4 / totalCalories) * 100).toFixed(0)}%
            </span>
          </div>
          <div
            className="chart-segment fats-segment"
            style={{ width: `${(macros.fats * 9 / totalCalories) * 100}%` }}
            title={`Fats: ${((macros.fats * 9 / totalCalories) * 100).toFixed(1)}%`}
          >
            <span className="segment-label">
              {((macros.fats * 9 / totalCalories) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="chart-legend">
          <span className="legend-item protein-legend">Protein</span>
          <span className="legend-item carbs-legend">Carbs</span>
          <span className="legend-item fats-legend">Fats</span>
        </div>
      </div>
    </div>
  );
}
