import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db, Collections } from '../lib/firebase';
import type { ScanResult } from '../types/user';
import { analyzeBody } from '../services/body-api';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'complete';
}

export function ScanProcessing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const { frontUrl, sideUrl, backUrl, timestamp } = location.state || {};

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'Uploading images', status: 'complete' },
    { id: 'api', label: 'Analyzing with GPT-4o Vision', status: 'processing' },
    { id: 'signature', label: 'Calculating Body Signature', status: 'pending' },
    { id: 'measurements', label: 'Extracting body measurements', status: 'pending' },
    { id: 'insights', label: 'Generating AI insights', status: 'pending' },
    { id: 'save', label: 'Saving results', status: 'pending' },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [scanId, setScanId] = useState<string>('');

  useEffect(() => {
    if (!frontUrl || !userProfile) {
      navigate('/scan');
      return;
    }

    // Call real API
    processBodyScan();
  }, [frontUrl, userProfile]);

  const updateStep = (stepIndex: number) => {
    setSteps((prevSteps) => {
      const newSteps = [...prevSteps];
      // Mark previous steps as complete
      for (let i = 0; i <= stepIndex; i++) {
        newSteps[i].status = 'complete';
      }
      // Mark current step as processing
      if (stepIndex + 1 < newSteps.length) {
        newSteps[stepIndex + 1].status = 'processing';
      }
      return newSteps;
    });
    setCurrentStepIndex(stepIndex);
  };

  const processBodyScan = async () => {
    if (!userProfile) return;

    try {
      // Step 1: Analyzing with GPT-4o Vision (already showing)
      console.log('🏋️ Starting body scan analysis...');

      // Build array of image URLs to analyze
      const imageUrls = [frontUrl];
      if (sideUrl) imageUrls.push(sideUrl);
      if (backUrl) imageUrls.push(backUrl);

      console.log(`📸 Analyzing ${imageUrls.length} photo(s)...`);

      // Call real API
      const response = await analyzeBody(imageUrls, userProfile.uid, {
        includeWorkoutPlan: false, // Can enable later
        includeNutritionPlan: false,
        goal: userProfile.fitnessGoal === 'lose_weight' ? 'lose_fat' :
              userProfile.fitnessGoal === 'build_muscle' ? 'gain_muscle' : 'maintain',
      });

      // Step 2: Body Signature calculated (part of API response)
      updateStep(1);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Measurements extracted
      updateStep(2);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Insights generated
      updateStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 5: Saving results
      updateStep(4);

      const scanId = `scan_${timestamp}`;
      setScanId(scanId);

      // Map API response to ScanResult interface
      const scanResult: ScanResult = {
        id: scanId,
        userId: userProfile.uid,
        timestamp: new Date(timestamp),
        bodyFatPercentage: response.scanResult.bodyFatPercentage,
        muscleMassLevel: response.scanResult.muscleMassLevel,
        physiqueRating: response.scanResult.physiqueRating,
        measurements: response.scanResult.measurements,
        posture: response.scanResult.posture,
        fitnessLevel: response.scanResult.fitnessLevel,
        muscleDevelopment: response.scanResult.muscleDevelopment,
        recommendations: response.scanResult.recommendations,
        confidence: response.scanResult.confidence,
        notes: response.scanResult.notes,
        bodySignature: response.scanResult.bodySignature,
        workoutPlan: response.workoutPlan,
        nutritionPlan: response.nutritionPlan,
        frontImageUrl: frontUrl,
        sideImageUrl: sideUrl,
        backImageUrl: backUrl,
        // Legacy fields for backward compatibility
        muscleMass: response.scanResult.muscleMassLevel === 'high' ? 70 :
                    response.scanResult.muscleMassLevel === 'moderate' ? 60 : 50,
        chestCm: response.scanResult.measurements?.chestCm,
        waistCm: response.scanResult.measurements?.waistCm,
        hipsCm: response.scanResult.measurements?.hipsCm,
        insights: [
          `Body Fat: ${response.scanResult.bodyFatPercentage}%`,
          `Fitness Level: ${response.scanResult.fitnessLevel}`,
          `Body Type: ${response.scanResult.bodySignature?.bodyTypeClassification || 'N/A'}`,
        ],
      };

      // Save to Firestore
      await setDoc(doc(db, Collections.SCANS, scanId), {
        ...scanResult,
        timestamp: scanResult.timestamp.toISOString(),
      });

      console.log('✅ Body scan complete!');
      console.log(`🔬 Body Signature: ${response.scanResult.bodySignature?.uniqueId}`);

      // Mark all steps complete
      updateStep(steps.length - 1);

      // Wait then navigate to results
      setTimeout(() => {
        navigate(`/scan/results/${scanId}`);
      }, 1000);
    } catch (error: any) {
      console.error('Body scan analysis error:', error);
      alert(`Analysis failed: ${error.message}. Please try again.`);
      navigate('/scan');
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
