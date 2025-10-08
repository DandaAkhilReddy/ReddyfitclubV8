import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db, Collections } from '../lib/firebase';
import { ScanResult } from '../types/user';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'complete';
}

export function ScanProcessing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const { frontUrl, timestamp } = location.state || {};

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'Uploading images', status: 'complete' },
    { id: 'qc', label: 'Quality check', status: 'processing' },
    { id: 'estimation', label: 'Body composition estimation', status: 'pending' },
    { id: 'deltas', label: 'Comparing with history', status: 'pending' },
    { id: 'insights', label: 'Generating insights', status: 'pending' },
    { id: 'nutrition', label: 'Creating meal plan', status: 'pending' },
    { id: 'workout', label: 'Designing workout plan', status: 'pending' },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [scanId, setScanId] = useState<string>('');

  useEffect(() => {
    if (!frontUrl || !userProfile) {
      navigate('/scan');
      return;
    }

    // Simulate processing steps
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          // Processing complete, create scan record
          createScanRecord();
          return prev;
        }

        // Update current step to complete
        setSteps((prevSteps) => {
          const newSteps = [...prevSteps];
          newSteps[prev].status = 'complete';
          if (prev + 1 < newSteps.length) {
            newSteps[prev + 1].status = 'processing';
          }
          return newSteps;
        });

        return prev + 1;
      });
    }, 2000); // Each step takes 2 seconds

    return () => clearInterval(interval);
  }, [frontUrl, userProfile]);

  const createScanRecord = async () => {
    if (!userProfile) return;

    const scanId = `scan_${timestamp}`;
    setScanId(scanId);

    // Create mock scan result (in production, this would come from Gemini API)
    const mockResult: ScanResult = {
      id: scanId,
      userId: userProfile.uid,
      timestamp: new Date(timestamp),
      bodyFatPercentage: 18.5,
      muscleMass: 68.2,
      visceralFat: 6.5,
      chestCm: 102,
      waistCm: 85,
      hipsCm: 98,
      armsCm: 35,
      thighsCm: 58,
      insights: [
        'Your body fat percentage is in the athletic range',
        'Muscle mass is above average for your demographics',
        'Visceral fat levels are healthy - keep it up!',
      ],
      recommendations: {
        nutrition: 'Aim for 2,200 calories/day with 40% protein, 30% carbs, 30% fats. Focus on lean proteins and complex carbs.',
        workout: '4-5 days of strength training per week. Mix compound movements with isolation exercises. Add 2 cardio sessions.',
        hydration: 'Drink 3-4 liters of water daily. Increase intake on workout days.',
      },
      frontImageUrl: frontUrl,
    };

    try {
      // Save to Firestore
      await setDoc(doc(db, Collections.SCANS, scanId), {
        ...mockResult,
        timestamp: mockResult.timestamp.toISOString(),
      });

      // Wait 1 second then navigate to results
      setTimeout(() => {
        navigate(`/scan/results/${scanId}`);
      }, 1000);
    } catch (error) {
      console.error('Error saving scan:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        {/* Processing Animation */}
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center mb-8">
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyzing Your Body Composition</h2>
          <p className="text-gray-600 mb-8">
            Our AI is processing your scan using advanced computer vision...
          </p>

          {/* Progress Steps */}
          <div className="space-y-3 text-left">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                  step.status === 'complete'
                    ? 'bg-green-50'
                    : step.status === 'processing'
                    ? 'bg-blue-50'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.status === 'complete' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : step.status === 'processing' ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <span
                    className={`font-medium ${
                      step.status === 'complete'
                        ? 'text-green-900'
                        : step.status === 'processing'
                        ? 'text-blue-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% complete
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-sm text-blue-800">
            💡 <strong>Did you know?</strong> ReddyFit analyzes 47+ body metrics in each scan,
            comparing them against 10M+ data points for personalized insights.
          </p>
        </div>
      </div>
    </div>
  );
}
