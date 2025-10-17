import React, { useState } from 'react';
import { Award, Copy, Share2, ChevronDown, ChevronUp, Shield, Sparkles } from 'lucide-react';
import type { BodySignature } from '../types/user';
import { MetricsGauge } from './MetricsGauge';

interface BodySignatureCardProps {
  bodySignature: BodySignature;
}

const bodyTypeDescriptions: Record<string, { emoji: string; description: string; color: string }> = {
  'V-Taper Aesthetic': {
    emoji: '🏆',
    description: 'Elite V-shaped physique with exceptional shoulder-to-waist ratio',
    color: 'from-yellow-400 to-amber-500',
  },
  'Classic Physique': {
    emoji: '💪',
    description: 'Well-balanced proportions with strong upper body development',
    color: 'from-blue-400 to-indigo-500',
  },
  'Rectangular Build': {
    emoji: '🟦',
    description: 'Balanced frame with similar shoulder and hip measurements',
    color: 'from-gray-400 to-gray-500',
  },
  'Athletic Build': {
    emoji: '⚡',
    description: 'Lean and toned with good muscle definition',
    color: 'from-green-400 to-emerald-500',
  },
  'Balanced Build': {
    emoji: '✨',
    description: 'Harmonious proportions with good overall symmetry',
    color: 'from-purple-400 to-pink-500',
  },
};

function getAestheticRating(score: number): { tier: string; emoji: string; color: string } {
  if (score >= 90) return { tier: 'Elite', emoji: '👑', color: 'text-yellow-600' };
  if (score >= 80) return { tier: 'Excellent', emoji: '🏆', color: 'text-purple-600' };
  if (score >= 70) return { tier: 'Very Good', emoji: '💎', color: 'text-blue-600' };
  if (score >= 60) return { tier: 'Good', emoji: '⭐', color: 'text-green-600' };
  if (score >= 50) return { tier: 'Average', emoji: '✓', color: 'text-gray-600' };
  return { tier: 'Developing', emoji: '🌱', color: 'text-orange-600' };
}

export function BodySignatureCard({ bodySignature }: BodySignatureCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const bodyTypeInfo = bodyTypeDescriptions[bodySignature.bodyTypeClassification] || bodyTypeDescriptions['Balanced Build'];
  const aestheticRating = getAestheticRating(bodySignature.aestheticScore);

  const handleCopy = () => {
    navigator.clipboard.writeText(bodySignature.uniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Your Body Signature
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </h2>
            <p className="text-purple-100 text-sm">Unique mathematical fingerprint</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          title="Copy Signature ID"
        >
          {copied ? (
            <span className="text-sm text-green-300">✓ Copied!</span>
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Unique ID */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-purple-200 font-medium">Signature ID</span>
          <Share2 className="w-4 h-4 text-purple-200" />
        </div>
        <div className="font-mono text-lg font-bold break-all">{bodySignature.uniqueId}</div>
        <div className="text-xs text-purple-200 mt-2">
          Hash: {bodySignature.compositionHash.slice(0, 12)}...
        </div>
      </div>

      {/* Body Type Classification */}
      <div className={`bg-gradient-to-r ${bodyTypeInfo.color} rounded-xl p-4 mb-6 text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{bodyTypeInfo.emoji}</span>
          <div>
            <h3 className="text-xl font-bold">{bodySignature.bodyTypeClassification}</h3>
            <p className="text-sm opacity-90">{bodyTypeInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-3xl font-bold">{bodySignature.goldenRatioScore.toFixed(1)}%</div>
          <div className="text-sm text-purple-200 mt-1">Golden Ratio</div>
        </div>
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-3xl font-bold">{bodySignature.adonisIndex.toFixed(2)}</div>
          <div className="text-sm text-purple-200 mt-1">Adonis Index</div>
        </div>
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-3xl font-bold">{bodySignature.symmetryCoefficient.toFixed(1)}%</div>
          <div className="text-sm text-purple-200 mt-1">Symmetry</div>
        </div>
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-3xl font-bold flex items-center justify-center gap-2">
            <span>{bodySignature.aestheticScore.toFixed(0)}</span>
            <span className="text-2xl">{aestheticRating.emoji}</span>
          </div>
          <div className="text-sm text-purple-200 mt-1">{aestheticRating.tier}</div>
        </div>
      </div>

      {/* Detailed Metrics (Collapsible) */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors flex items-center justify-between"
      >
        <span className="font-semibold">Detailed Metrics</span>
        {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {showDetails && (
        <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-purple-200 mb-1">Waist/Hip Ratio</div>
              <div className="text-2xl font-bold">{bodySignature.detailedMetrics.waistToHipRatio.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm text-purple-200 mb-1">Shoulder/Waist</div>
              <div className="text-2xl font-bold">{bodySignature.detailedMetrics.shoulderToWaistRatio.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm text-purple-200 mb-1">Chest/Waist</div>
              <div className="text-2xl font-bold">{bodySignature.detailedMetrics.chestToWaistRatio.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm text-purple-200 mb-1">Arm/Chest</div>
              <div className="text-2xl font-bold">{bodySignature.detailedMetrics.armToChestRatio.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm text-purple-200 mb-1">Leg/Torso Balance</div>
              <div className="text-2xl font-bold">{bodySignature.detailedMetrics.legTorsoBalance.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm text-purple-200 mb-1">Upper/Lower Symmetry</div>
              <div className="text-2xl font-bold">{bodySignature.detailedMetrics.upperLowerSymmetry.toFixed(3)}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20">
            <h4 className="text-sm font-semibold text-purple-200 mb-3">What These Mean:</h4>
            <div className="space-y-2 text-sm text-purple-100">
              <p><strong>Golden Ratio:</strong> Measures adherence to φ ≈ 1.618 (the "perfect" proportion)</p>
              <p><strong>Adonis Index:</strong> Shoulder/waist ratio (ideal ≥ 1.6 for V-taper)</p>
              <p><strong>Symmetry:</strong> Overall balance between body parts (higher is better)</p>
              <p><strong>Aesthetic Score:</strong> Composite rating based on all metrics</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-purple-200">
        <p className="flex items-center justify-center gap-2">
          <Award className="w-4 h-4" />
          Nobel Prize-level mathematical analysis
        </p>
      </div>
    </div>
  );
}
