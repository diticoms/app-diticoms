
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Polyfill for process to prevent ReferenceError in browser libraries (like @google/genai)
if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

// Sử dụng hàm đã được định nghĩa trong index.html để đảm bảo tính đồng bộ
const removeSplash = () => {
  if (typeof (window as any).removeSplash === 'function') {
    (window as any).removeSplash();
  }
};

const rootElement = document.getElementById('root');
if (rootElement) {
  // Xóa splash ngay lập tức khi JavaScript này được thực thi thành công
  removeSplash();
  
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
