import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("Diticoms Service Manager: Khởi chạy ứng dụng...");

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Không tìm thấy phần tử root!");
}