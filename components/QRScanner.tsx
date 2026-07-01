import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: any) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }, 
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // Only camera
      },
      false
    );

    let isScanning = true;

    scanner.render(
      (text) => {
        if (isScanning) {
          isScanning = false;
          onScan(text);
          scanner.clear();
        }
      },
      (err) => {
        if (onError) onError(err);
      }
    );

    return () => {
      isScanning = false;
      scanner.clear().catch(console.error);
    };
  }, [onScan, onError]);

  return (
    <div className="w-full bg-slate-100 rounded-2xl overflow-hidden p-2">
      <div id="qr-reader" className="w-full max-w-sm mx-auto border-none shadow-none"></div>
    </div>
  );
};
