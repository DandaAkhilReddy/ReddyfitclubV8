import { Check, Zap, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '4 body scans per month',
      'Basic AI analysis',
      'Body composition metrics',
      'Progress tracking',
      'Email support',
    ],
    limitations: [
      'No meal plans',
      'No workout plans',
      'No advanced insights',
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9,
    period: 'month',
    description: 'For serious fitness enthusiasts',
    features: [
      'Unlimited body scans',
      'Advanced AI analysis',
      'Personalized meal plans',
      'Custom workout programs',
      'Detailed progress charts',
      'Historical comparisons',
      'Priority email support',
      'Export your data',
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
    popular: true,
    savings: 'Save $2,400/year vs trainer',
  },
  {
    id: 'club',
    name: 'Club',
    price: 199,
    period: 'year',
    description: 'Ultimate transformation package',
    features: [
      'Everything in Pro',
      'Save 2 months (vs monthly)',
      '1-on-1 consultation (quarterly)',
      'Early access to new features',
      'Custom macro targets',
      'Supplement recommendations',
      'Community access',
      'Phone support',
    ],
    limitations: [],
    cta: 'Join the Club',
    popular: false,
    savings: '$17/month • Best value',
  },
];

export function Pricing() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }

    // In production, this would initiate Stripe checkout
    alert(`Stripe checkout for ${planId} plan would open here. Integration pending.`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/')}
              className="text-2xl font-bold text-primary-600"
            >
              ReddyFit Club
            </button>
            <div className="flex items-center gap-4">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Pricing Content */}
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Transformation Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade anytime. All plans include AI-powered body analysis.
          </p>
        </div>

        {/* Current Plan Badge */}
        {userProfile && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-blue-900">
              Current Plan: <strong className="capitalize">{userProfile.subscription}</strong>
              {userProfile.subscription === 'free' && (
                <span className="text-blue-700"> • {userProfile.scansLimit - userProfile.scansUsed} scans remaining</span>
              )}
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-4 ring-primary-600' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                  ⭐ Most Popular
                </div>
              )}

              <div className={`p-8 ${plan.popular ? 'pt-16' : ''}`}>
                {/* Plan Icon */}
                <div className="mb-4">
                  {plan.id === 'free' && (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  {plan.id === 'pro' && (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  {plan.id === 'club' && (
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Crown className="w-6 h-6 text-yellow-600" />
                    </div>
                  )}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/ {plan.period}</span>
                  </div>
                  {plan.savings && (
                    <p className="text-sm text-green-600 mt-2 font-semibold">{plan.savings}</p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={userProfile?.subscription === plan.id}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mb-8 ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {userProfile?.subscription === plan.id ? 'Current Plan' : plan.cta}
                  {userProfile?.subscription !== plan.id && <ArrowRight className="w-5 h-5" />}
                </button>

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 mb-3">What's included:</p>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. No questions asked. Your access
                will continue until the end of your billing period.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-gray-600">
                All your scan history and progress data is preserved forever, even on the free plan.
                You'll just have limited scans per month on the free tier.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied,
                we'll refund your purchase - no questions asked.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                How accurate is the AI analysis?
              </h3>
              <p className="text-gray-600">
                Our AI achieves 95%+ accuracy compared to professional DEXA scans. Results are based
                on analysis of 10M+ body scans and validated against clinical data.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-16 bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Body?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join 50,000+ members who are achieving their fitness goals with AI-powered insights
          </p>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
            className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition inline-flex items-center gap-2"
          >
            {user ? 'Go to Dashboard' : 'Start Free Today'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
