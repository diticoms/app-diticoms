import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 64 }) => {
  return (
    <img 
      src="public/logo.png" 
      alt="Diticoms Logo"
      width={size}
      height={size}
      className={`${className} object-contain`}
      onError={(e) => {
        // Fallback if image not found
        const target = e.target as HTMLImageElement;
        target.src = 'https://service.diticoms.vn/logo.png';
      }}
    />
  );
};