import { useAuth } from '../hooks/useAuth';
import { ArrowRight, Camera, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getSubscriptionBadge = () => {
    switch (userProfile.subscription) {
      case 'club':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">Club Member</span>;
      case 'pro':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">Pro</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">Free</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-primary-600">ReddyFit Club</div>
            <div className="flex items-center gap-6">
              <span className="text-gray-700">{userProfile.displayName || userProfile.email}</span>
              {getSubscriptionBadge()}
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {userProfile.displayName?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Ready to track your fitness progress?
          </p>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Scans Remaining */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Camera className="w-8 h-8 text-primary-600" />
              <span className="text-sm text-gray-500">This month</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {userProfile.scansLimit - userProfile.scansUsed}
            </h3>
            <p className="text-gray-600">Scans remaining</p>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{
                  width: `${((userProfile.scansLimit - userProfile.scansUsed) / userProfile.scansLimit) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-sm text-gray-500">Plan</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2 capitalize">
              {userProfile.subscription}
            </h3>
            <p className="text-gray-600">Current plan</p>
            {userProfile.subscription === 'free' && (
              <button
                onClick={() => navigate('/pricing')}
                className="mt-4 w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Upgrade Now
              </button>
            )}
          </div>

          {/* Next Reset */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-500">Resets</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {Math.ceil((userProfile.resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
            </h3>
            <p className="text-gray-600">Days until reset</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Scan */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg p-8 text-white">
            <Camera className="w-12 h-12 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Start Your Daily Scan</h2>
            <p className="mb-6 opacity-90">
              Track your body composition with AI-powered analysis in under 60 seconds.
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors"
            >
              Start Scan
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* View Progress */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
            <TrendingUp className="w-12 h-12 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">View Your Progress</h2>
            <p className="text-gray-600 mb-6">
              See how your body composition has changed over time with detailed charts and insights.
            </p>
            <button
              onClick={() => navigate('/progress')}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              View Progress
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recent Scans Placeholder */}
        {userProfile.scansUsed === 0 && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-blue-900 mb-2">No scans yet!</h3>
            <p className="text-blue-700 mb-4">
              Take your first body composition scan to start tracking your fitness journey.
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Take First Scan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
