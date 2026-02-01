import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 64 }) => {
  const [imgSrc, setImgSrc] = useState("logo.png");
  const [retryCount, setRetryCount] = useState(0);

  const handleError = () => {
    if (retryCount === 0) {
      setImgSrc("public/logo.png");
      setRetryCount(1);
    } else if (retryCount === 1) {
      setImgSrc("https://service.diticoms.vn/logo.png");
      setRetryCount(2);
    }
  };

  return (
    <img 
      src={imgSrc} 
      alt="Diticoms Logo"
      width={size}
      height={size}
      className={`${className} object-contain`}
      onError={handleError}
    />
  );
};