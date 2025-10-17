// Workout Suggestion Display Component
import { useState } from 'react';
import type { WorkoutPlan } from '../../services/ai-api';
import './AICoach.css';

interface WorkoutSuggestionProps {
  workout: WorkoutPlan;
  onStartWorkout?: () => void;
}

export default function WorkoutSuggestion({ workout, onStartWorkout }: WorkoutSuggestionProps) {
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  const toggleExercise = (index: number) => {
    setExpandedExercise(expandedExercise === index ? null : index);
  };

  return (
    <div className="workout-suggestion">
      <div className="workout-header">
        <h3>💪 {workout.title}</h3>
        <div className="workout-meta">
          <span className="workout-badge difficulty">{workout.difficulty}</span>
          <span className="workout-badge duration">⏱️ {workout.duration} min</span>
          <span className="workout-badge calories">🔥 ~{workout.caloriesBurned} cal</span>
        </div>
      </div>

      <p className="workout-description">{workout.description}</p>

      {/* AI Reasoning */}
      <div className="ai-reasoning">
        <h4>🤖 Why This Workout?</h4>
        <p>{workout.reasoning}</p>
      </div>

      {/* Exercise List */}
      <div className="exercises-section">
        <h4>📋 Workout Plan ({workout.exercises.length} exercises)</h4>

        <div className="exercises-list">
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="exercise-card">
              <div
                className="exercise-header"
                onClick={() => toggleExercise(index)}
              >
                <div className="exercise-title">
                  <span className="exercise-number">{index + 1}</span>
                  <div>
                    <div className="exercise-name">{exercise.name}</div>
                    <div className="exercise-muscle">🎯 {exercise.muscle}</div>
                  </div>
                </div>
                <div className="exercise-quick-info">
                  <span className="exercise-sets">{exercise.sets} sets</span>
                  <span className="exercise-reps">{exercise.reps} reps</span>
                  <span className="exercise-rest">🕐 {exercise.rest}s rest</span>
                </div>
                <button className="expand-button">
                  {expandedExercise === index ? '▲' : '▼'}
                </button>
              </div>

              {expandedExercise === index && (
                <div className="exercise-details">
                  {/* Instructions */}
                  <div className="instructions-section">
                    <h5>📖 How to Perform:</h5>
                    <ol>
                      {exercise.instructions.map((instruction, i) => (
                        <li key={i}>{instruction}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Form Cues */}
                  <div className="form-cues-section">
                    <h5>✅ Form Cues:</h5>
                    <ul className="form-cues-list">
                      {exercise.formCues.map((cue, i) => (
                        <li key={i}>{cue}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Alternative Exercises */}
                  {exercise.alternativeExercises && exercise.alternativeExercises.length > 0 && (
                    <div className="alternatives-section">
                      <h5>🔄 Alternative Exercises:</h5>
                      <div className="alternatives-list">
                        {exercise.alternativeExercises.map((alt, i) => (
                          <span key={i} className="alternative-badge">{alt}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Workout Summary */}
      <div className="workout-summary">
        <h4>📊 Workout Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total Duration</span>
            <span className="summary-value">{workout.duration} min</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Exercises</span>
            <span className="summary-value">{workout.exercises.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Estimated Calories</span>
            <span className="summary-value">{workout.caloriesBurned} cal</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Difficulty</span>
            <span className="summary-value">{workout.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="workout-actions">
        {onStartWorkout && (
          <button className="start-workout-button primary" onClick={onStartWorkout}>
            🏋️ Start Workout Now
          </button>
        )}
        <button className="save-workout-button secondary">
          💾 Save for Later
        </button>
        <button className="share-workout-button secondary">
          📤 Share
        </button>
      </div>
    </div>
  );
}
