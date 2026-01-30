import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("Diticoms Service Manager: Ứng dụng đang khởi chạy...");

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Lỗi: Không tìm thấy phần tử #root");
}