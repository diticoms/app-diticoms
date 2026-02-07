import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 64 }) => {
  return (
    <img 
      src="public/logo.png" 
      alt="Logo"
      width={size}
      height={size}
      className={`${className} object-contain`}
      loading="eager"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        // Fallback logic nếu public/logo.png không tải được
        if (target.src.indexOf('public/') !== -1) {
          target.src = 'logo.png';
        }
      }}
    />
  );
};