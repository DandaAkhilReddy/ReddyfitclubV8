// Trial Banner Component for AI Coach
import { useNavigate } from 'react-router-dom';
import './AICoach.css';

interface TrialBannerProps {
  isInTrial: boolean;
  daysRemaining: number;
  usageCount: number;
  usageLimit: number;
  usagePercentage: number;
  subscription: 'free' | 'pro' | 'club';
}

export default function TrialBanner({
  isInTrial,
  daysRemaining,
  usageCount,
  usageLimit,
  usagePercentage,
  subscription,
}: TrialBannerProps) {
  const navigate = useNavigate();

  if (isInTrial) {
    return (
      <div className="trial-banner trial-active">
        <div className="trial-content">
          <div className="trial-icon">🎉</div>
          <div className="trial-info">
            <div className="trial-title">
              <strong>Free Trial Active!</strong>
              <span className="trial-badge">30-Day Trial</span>
            </div>
            <p className="trial-description">
              You have <strong>{daysRemaining} days</strong> remaining with{' '}
              <strong>unlimited AI analyses</strong>. Try all features risk-free!
            </p>
            <div className="trial-stats">
              <div className="trial-stat">
                <span className="stat-label">Analyses Used:</span>
                <span className="stat-value">{usageCount}</span>
              </div>
              <div className="trial-stat">
                <span className="stat-label">Limit:</span>
                <span className="stat-value">Unlimited ♾️</span>
              </div>
            </div>
          </div>
        </div>
        <button
          className="trial-cta-button"
          onClick={() => navigate('/pricing')}
        >
          View Plans
        </button>
      </div>
    );
  }

  // Trial expired - show plan-based limits
  return (
    <div className={`trial-banner trial-expired ${usagePercentage >= 80 ? 'usage-warning' : ''}`}>
      <div className="trial-content">
        <div className="trial-icon">
          {usagePercentage >= 100 ? '🚫' : usagePercentage >= 80 ? '⚠️' : '📊'}
        </div>
        <div className="trial-info">
          <div className="trial-title">
            <strong>
              {subscription === 'free' && 'Free Plan'}
              {subscription === 'pro' && 'Pro Plan'}
              {subscription === 'club' && 'Club Plan'}
            </strong>
            {usagePercentage >= 100 && (
              <span className="trial-badge limit-reached">Limit Reached</span>
            )}
          </div>
          <p className="trial-description">
            {usagePercentage >= 100 ? (
              <>
                You've used all <strong>{usageLimit}</strong> AI analyses this month.
              </>
            ) : (
              <>
                You've used <strong>{usageCount}</strong> of <strong>{usageLimit}</strong>{' '}
                {subscription === 'club' ? 'unlimited' : 'AI analyses'} this month.
              </>
            )}
          </p>

          {/* Usage Bar */}
          <div className="usage-bar-container">
            <div className="usage-bar">
              <div
                className={`usage-fill ${
                  usagePercentage >= 100
                    ? 'usage-full'
                    : usagePercentage >= 80
                    ? 'usage-high'
                    : ''
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <span className="usage-text">
              {Math.round(usagePercentage)}% used
            </span>
          </div>

        </div>
      </div>

      {/* CTA Button */}
      {usagePercentage >= 80 && subscription !== 'club' && (
        <button
          className="trial-cta-button upgrade-button"
          onClick={() => navigate('/pricing')}
        >
          {usagePercentage >= 100 ? 'Upgrade Now' : 'View Plans'}
        </button>
      )}
    </div>
  );
}
