import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const removeSplash = () => {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => {
      if (splash.parentNode) splash.remove();
    }, 500);
  }
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Gỡ màn hình chờ sau khi ứng dụng bắt đầu render
  setTimeout(removeSplash, 1200);
}