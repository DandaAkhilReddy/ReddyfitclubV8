import React from 'react';
import { Ruler, Target } from 'lucide-react';

interface Measurements {
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepCm?: number;
  thighCm?: number;
  shoulderWidthCm?: number;
  neckCm?: number;
  calfCm?: number;
  forearmCm?: number;
  heightCm?: number;
}

interface MeasurementsGridProps {
  measurements: Measurements;
}

const measurementConfig = [
  { key: 'heightCm', label: 'Height', icon: Target },
  { key: 'shoulderWidthCm', label: 'Shoulders', icon: Ruler },
  { key: 'chestCm', label: 'Chest', icon: Ruler },
  { key: 'waistCm', label: 'Waist', icon: Ruler },
  { key: 'hipsCm', label: 'Hips', icon: Ruler },
  { key: 'bicepCm', label: 'Biceps', icon: Ruler },
  { key: 'forearmCm', label: 'Forearms', icon: Ruler },
  { key: 'thighCm', label: 'Thighs', icon: Ruler },
  { key: 'calfCm', label: 'Calves', icon: Ruler },
  { key: 'neckCm', label: 'Neck', icon: Ruler },
];

export function MeasurementsGrid({ measurements }: MeasurementsGridProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Ruler className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Body Measurements</h3>
          <p className="text-sm text-gray-500">Detailed measurements in centimeters</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {measurementConfig.map(({ key, label, icon: Icon }) => {
          const value = measurements[key as keyof Measurements];

          if (!value) {
            return (
              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg opacity-50">
                <Icon className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-400">—</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            );
          }

          return (
            <div key={key} className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow">
              <Icon className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {value.toFixed(0)}
                <span className="text-sm text-gray-500 ml-1">cm</span>
              </div>
              <div className="text-xs text-gray-600 mt-1 font-medium">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Key ratios (optional, derived from measurements) */}
      {measurements.shoulderWidthCm && measurements.waistCm && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Ratios</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {measurements.waistCm && measurements.hipsCm && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {(measurements.waistCm / measurements.hipsCm).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Waist/Hip</div>
              </div>
            )}
            {measurements.shoulderWidthCm && measurements.waistCm && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {(measurements.shoulderWidthCm / measurements.waistCm).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Shoulder/Waist</div>
              </div>
            )}
            {measurements.chestCm && measurements.waistCm && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {(measurements.chestCm / measurements.waistCm).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Chest/Waist</div>
              </div>
            )}
            {measurements.bicepCm && measurements.chestCm && (
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {(measurements.bicepCm / measurements.chestCm).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Arm/Chest</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
