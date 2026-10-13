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
        className="transform transition-transform hover:scale-105 duration-300 drop-shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
      >
        <defs>
          <linearGradient id="dhruBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="45%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id="dhruPulseGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <filter id="dhruGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle Badge Background */}
        <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#dhruBlueGrad)" />
        
        {/* Inner Subtle Radial Highlight */}
        <rect x="5" y="5" width="90" height="90" rx="23" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

        {/* The Iconic 'D' Monogram Geometry */}
        {/* Backbone / Stem of the D with sharp ascending diagonal cut */}
        <path
          d="M26 22 H46 C64 22 76 34 76 50 C76 66 64 78 46 78 H26 Z"
          fill="#FFFFFF"
        />

        {/* Inner Counter Hole of the 'D' */}
        <path
          d="M38 34 H45 C56 34 62 41 62 50 C62 59 56 66 45 66 H38 Z"
          fill="url(#dhruBlueGrad)"
        />

        {/* Financial Upward Momentum Indicator inside the 'D' */}
        <path
          d="M38 58 L45 48 L51 53 L58 42"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="58" cy="42" r="2.5" fill="#38BDF8" filter="url(#dhruGlow)" />
      </svg>
    </div>
  );
};
