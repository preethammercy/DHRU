import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const DhruLogo: React.FC<LogoProps> = ({ className = 'w-9 h-9', size = 36 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform transition-transform hover:scale-105 duration-300"
      >
        <rect x="4" y="4" width="92" height="92" rx="24" fill="var(--primary-fill)" />

        {/* The Iconic 'D' Monogram Geometry */}
        {/* Backbone / Stem of the D with sharp ascending diagonal cut */}
        <path
          d="M26 22 H46 C64 22 76 34 76 50 C76 66 64 78 46 78 H26 Z"
          fill="var(--on-primary)"
        />

        {/* Inner Counter Hole of the 'D' */}
        <path
          d="M38 34 H45 C56 34 62 41 62 50 C62 59 56 66 45 66 H38 Z"
          fill="var(--primary-fill)"
        />

        {/* Financial Upward Momentum Indicator inside the 'D' */}
        <path
          d="M38 58 L45 48 L51 53 L58 42"
          stroke="var(--on-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="58" cy="42" r="2.5" fill="var(--info)" />
      </svg>
    </div>
  );
};
