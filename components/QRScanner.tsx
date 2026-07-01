import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: any) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isScanning = true;
    scannerRef.current = new Html5Qrcode("qr-reader");

    const startScanner = async () => {
      try {
        await scannerRef.current?.start(
          { facingMode: "environment" }, // Ưu tiên camera sau của điện thoại
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => {
            if (isScanning) {
              isScanning = false;
              onScan(text);
              scannerRef.current?.stop().catch(console.error);
            }
          },
          (err) => {
            if (onError) onError(err);
          }
        );
        setHasPermission(true);
      } catch (err) {
        console.error("Lỗi khởi tạo camera:", err);
        setHasPermission(false);
      }
    };

    startScanner();

    return () => {
      isScanning = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan, onError]);

  return (
    <div className="w-full bg-slate-900 rounded-2xl overflow-hidden p-2 relative">
      {hasPermission === false && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <p className="font-bold text-sm mb-2">Không thể truy cập Camera</p>
          <p className="text-xs text-slate-400">Vui lòng cấp quyền Camera cho trình duyệt hoặc kiểm tra lại thiết bị.</p>
        </div>
      )}
      <div id="qr-reader" className="w-full max-w-sm mx-auto border-none shadow-none bg-black min-h-[300px]"></div>
    </div>
  );
};
