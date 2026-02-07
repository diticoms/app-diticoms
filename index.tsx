
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Đảm bảo Splash Screen biến mất ngay khi JavaScript được nạp thành công
const removeSplash = () => {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 600);
  }
};

// Khắc phục lỗi "process is not defined" nếu môi trường chưa cung cấp
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

const rootElement = document.getElementById('root');
if (rootElement) {
  // Xóa splash sau một khoảng ngắn để người dùng thấy logo mượt mà
  setTimeout(removeSplash, 300);
  
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
