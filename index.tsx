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
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    // Gỡ splash sớm hơn để tránh cảm giác bị treo
    removeSplash();
  } catch (err) {
    console.error("Render error:", err);
    // Vẫn gỡ splash nếu có lỗi render để xem được thông báo lỗi từ React
    removeSplash();
  }
}