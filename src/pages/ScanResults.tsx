import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, Collections } from '../lib/firebase';
import type { ScanResult } from '../types/user';
import { TrendingUp, TrendingDown, Activity, Droplet, Apple, Dumbbell, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BodySignatureCard } from '../components/BodySignatureCard';
import { MeasurementsGrid } from '../components/MeasurementsGrid';
import { MetricsGauge } from '../components/MetricsGauge';

export function ScanResults() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScan = async () => {
      if (!scanId) return;

      try {
        const scanDoc = await getDoc(doc(db, Collections.SCANS, scanId));
        if (scanDoc.exists()) {
          const data = scanDoc.data();
          setScan({
            ...data,
            timestamp: new Date(data.timestamp),
          } as ScanResult);
        }
      } catch (error) {
        console.error('Error fetching scan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [scanId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Scan not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-primary-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Mock historical data for charts
  const historicalData = [
    { date: 'Week 1', bodyFat: 22.5, muscle: 62.1 },
    { date: 'Week 2', bodyFat: 21.2, muscle: 64.3 },
    { date: 'Week 3', bodyFat: 19.8, muscle: 66.0 },
    { date: 'Week 4', bodyFat: scan.bodyFatPercentage, muscle: scan.muscleMass },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-2xl font-bold text-primary-600"
            >
              ReddyFit Club
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Results Content */}
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white mb-8 text-center">
          <div className="inline-block p-4 bg-white/20 rounded-full mb-4">
            <Activity className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Scan Complete! 🎉</h1>
          <p className="text-xl text-green-100">
            Your personalized fitness plan is ready
          </p>
        </div>

        {/* Body Signature - Highlighted Section */}
        {scan.bodySignature && (
          <div className="mb-8">
            <BodySignatureCard bodySignature={scan.bodySignature} />
          </div>
        )}

        {/* Body Composition Metrics with Gauges */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Body Composition</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <MetricsGauge
              value={scan.bodyFatPercentage}
              maxValue={50}
              label="Body Fat Percentage"
              unit="%"
              color="red"
              size="lg"
            />
            <MetricsGauge
              value={scan.muscleMass || 0}
              maxValue={100}
              label="Muscle Mass"
              unit=" kg"
              color="blue"
              size="lg"
            />
            <MetricsGauge
              value={scan.visceralFat || 0}
              maxValue={20}
              label="Visceral Fat"
              color="yellow"
              size="lg"
            />
          </div>
        </div>

        {/* Body Measurements */}
        {scan.measurements && (
          <div className="mb-8">
            <MeasurementsGrid measurements={scan.measurements} />
          </div>
        )}

        {/* Progress Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Your Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="#EF4444"
                strokeWidth={3}
                name="Body Fat %"
              />
              <Line
                type="monotone"
                dataKey="muscle"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Muscle Mass (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🤖 AI Insights</h3>
          <div className="space-y-3">
            {scan.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {index + 1}
                </div>
                <p className="text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Nutrition */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Apple className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Nutrition Plan</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">{scan.recommendations.nutrition}</p>
            <button className="text-green-600 font-semibold hover:underline text-sm flex items-center gap-1">
              View Full Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Workout */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Dumbbell className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Workout Plan</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">{scan.recommendations.workout}</p>
            <button className="text-blue-600 font-semibold hover:underline text-sm flex items-center gap-1">
              View Full Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hydration */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Droplet className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Hydration</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">{scan.recommendations.hydration}</p>
            <button className="text-cyan-600 font-semibold hover:underline text-sm flex items-center gap-1">
              Set Reminders
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-semibold hover:bg-gray-300"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/scan')}
            className="flex-1 bg-primary-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-primary-700 flex items-center justify-center gap-2"
          >
            Take Another Scan
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
