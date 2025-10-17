import React from 'react';

interface MetricsGaugeProps {
  value: number;
  maxValue?: number;
  label: string;
  unit?: string;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  blue: {
    stroke: 'stroke-blue-600',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  green: {
    stroke: 'stroke-green-600',
    text: 'text-green-600',
    bg: 'bg-green-50',
  },
  purple: {
    stroke: 'stroke-purple-600',
    text: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  yellow: {
    stroke: 'stroke-yellow-600',
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  red: {
    stroke: 'stroke-red-600',
    text: 'text-red-600',
    bg: 'bg-red-50',
  },
};

const sizeConfig = {
  sm: { radius: 35, strokeWidth: 6, fontSize: 'text-lg', padding: 'p-4' },
  md: { radius: 45, strokeWidth: 8, fontSize: 'text-2xl', padding: 'p-6' },
  lg: { radius: 60, strokeWidth: 10, fontSize: 'text-3xl', padding: 'p-8' },
};

export function MetricsGauge({
  value,
  maxValue = 100,
  label,
  unit = '',
  color = 'blue',
  size = 'md',
}: MetricsGaugeProps) {
  const { radius, strokeWidth, fontSize, padding } = sizeConfig[size];
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / maxValue) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = colorClasses[color];

  return (
    <div className={`flex flex-col items-center ${padding}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          className="transform -rotate-90"
          width={radius * 2 + strokeWidth * 2}
          height={radius * 2 + strokeWidth * 2}
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={`${colors.stroke} transition-all duration-1000 ease-out`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${fontSize} ${colors.text}`}>
            {value.toFixed(value < 10 ? 1 : 0)}
            {unit && <span className="text-sm">{unit}</span>}
          </div>
        </div>
      </div>
      {/* Label */}
      <div className="mt-3 text-center">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-1">
          {percentage.toFixed(0)}% {maxValue !== 100 && `of ${maxValue}`}
        </p>
      </div>
    </div>
  );
}
