import React from 'react';
import { motion } from 'motion/react';

interface ProgressArcProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const ProgressArc: React.FC<ProgressArcProps> = ({
  percent,
  size = 168,
  strokeWidth = 10,
  color = '#f7f8f8',
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference * (1 - clamped / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      role="img"
      aria-label={`${Math.round(clamped)} percent complete`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#1a1a1a"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: target }}
        transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.15 }}
      />
    </svg>
  );
};
