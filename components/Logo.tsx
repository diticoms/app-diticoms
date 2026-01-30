
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 64, light = false }) => {
  const color = light ? "#ffffff" : "#1d4ed8";
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Hexagon Shape */}
      <path 
        d="M256 32L446.526 142V370L256 480L65.474 370V142L256 32Z" 
        fill={color} 
      />
      {/* Stylized 'D' */}
      <path 
        d="M190 160H270C330 160 370 200 370 256C370 312 330 352 270 352H190V160Z" 
        stroke={light ? "#1d4ed8" : "white"} 
        strokeWidth="35" 
        strokeLinejoin="round" 
      />
      <path 
        d="M190 160V352" 
        stroke={light ? "#1d4ed8" : "white"} 
        strokeWidth="45" 
        strokeLinecap="round" 
      />
      {/* Small Wrench Detail */}
      <rect x="230" y="235" width="15" height="40" rx="4" fill={light ? "#1d4ed8" : "white"} transform="rotate(45 230 235)" />
      <circle cx="265" cy="256" r="25" fill={light ? "#1d4ed8" : "white"} />
      <rect x="255" y="246" width="20" height="20" fill={color} />
    </svg>
  );
};
