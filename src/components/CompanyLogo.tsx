import React from 'react';

interface CompanyLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ className = '', width = 120, height = "auto" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 120" 
      width={width} 
      height={height} 
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx="150" cy="60" rx="145" ry="55" fill="#2B3B6E" />
      <line x1="50" y1="36" x2="250" y2="36" stroke="#FFFFFF" strokeWidth="1.5" />
      <text 
        x="150" 
        y="68" 
        fontFamily="Arial, sans-serif" 
        fontWeight="900" 
        fontSize="34" 
        fill="#FFFFFF" 
        textAnchor="middle" 
        alignmentBaseline="middle"
        letterSpacing="1"
      >
        PAN NIGERIA
      </text>
      <line x1="50" y1="78" x2="250" y2="78" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
};
