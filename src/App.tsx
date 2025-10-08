import { CheckCircle2, TrendingUp, Zap, ArrowRight, DollarSign } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary-600">ReddyFit Club</div>
          <div className="flex items-center gap-6">
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <button className="btn-primary">Start Free Trial</button>
          </div>
        </div>
      </nav>

      {/* Hero Section - ROI Focused */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* ROI Badge */}
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <DollarSign className="w-4 h-4" />
            <span>Save $2,400/year vs Personal Trainer</span>
          </div>

          {/* Main Headline - Value Proposition */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Replace Your <span className="text-primary-600">$200/mo Trainer</span><br/>
            with $29 AI Coaching
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Professional body composition analysis, personalized meal plans, and 24/7 AI coaching.
            <strong className="text-gray-900"> 85% cost savings</strong> with better results.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="bg-white border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:border-primary-600 transition">
              View Pricing
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>50,000+ paying members</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>$10M+ in client savings</span>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">The Math is Simple</h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Traditional Trainer */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-red-900 mb-6">Traditional Trainer</h3>
              <div className="space-y-4 text-gray-700">
                <div className="flex justify-between">
                  <span>Monthly sessions (4x)</span>
                  <span className="font-semibold">$200</span>
                </div>
                <div className="flex justify-between">
                  <span>Meal planning</span>
                  <span className="font-semibold">$50</span>
                </div>
                <div className="flex justify-between">
                  <span>Gym membership</span>
                  <span className="font-semibold">$60</span>
                </div>
                <div className="border-t-2 border-red-300 pt-4 flex justify-between text-xl font-bold text-red-900">
                  <span>Total / month</span>
                  <span>$310</span>
                </div>
                <div className="text-center pt-2 text-red-700">
                  = <strong>$3,720 / year</strong>
                </div>
              </div>
            </div>

            {/* ReddyFit Club */}
            <div className="bg-green-50 border-2 border-green-600 rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                You Save $252/mo
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-6">ReddyFit Club</h3>
              <div className="space-y-4 text-gray-700">
                <div className="flex justify-between">
                  <span>Pro Plan</span>
                  <span className="font-semibold">$59</span>
                </div>
                <div className="flex justify-between">
                  <span>24/7 AI coaching</span>
                  <span className="font-semibold text-green-600">Included</span>
                </div>
                <div className="flex justify-between">
                  <span>Unlimited scans</span>
                  <span className="font-semibold text-green-600">Included</span>
                </div>
                <div className="border-t-2 border-green-300 pt-4 flex justify-between text-xl font-bold text-green-900">
                  <span>Total / month</span>
                  <span>$59</span>
                </div>
                <div className="text-center pt-2 text-green-700">
                  = <strong>$708 / year</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto mt-12 text-center bg-primary-600 text-white rounded-xl p-8">
            <TrendingUp className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">You Save $3,012 / Year</h3>
            <p className="text-primary-100">That's 81% cost savings with unlimited 24/7 access</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Start Saving Today</h2>
            <p className="text-xl mb-8 text-primary-100">Join 50,000+ members who chose smart fitness</p>
            <button className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 mx-auto">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-6 text-sm text-primary-100">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
