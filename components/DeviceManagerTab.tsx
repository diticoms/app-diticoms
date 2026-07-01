import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Search, Printer, PlusCircle, MonitorCheck, ChevronLeft, Wrench, X } from 'lucide-react';
import { callSheetAPI } from '../services/api.ts';
import { SHEET_API_URL } from '../constants.ts';
import { DeviceProfile, ServiceTicket, User } from '../types.ts';
import { QRScanner } from './QRScanner.tsx';
import { QRCodeSVG } from 'qrcode.react';

interface DeviceManagerTabProps {
  services: ServiceTicket[];
  currentUser: User | null;
  onCreateTicket: (device: DeviceProfile) => void;
}

export const DeviceManagerTab: React.FC<DeviceManagerTabProps> = ({ services, currentUser, onCreateTicket }) => {
  const [devices, setDevices] = useState<DeviceProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'search' | 'scan' | 'add' | 'view'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<DeviceProfile | null>(null);
  
  const [newDevice, setNewDevice] = useState<Partial<DeviceProfile>>({
    customerName: '',
    customerPhone: '',
    specs: ''
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await callSheetAPI(SHEET_API_URL, 'read_devices');
      if (Array.isArray(res)) {
        setDevices(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateDeviceId = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DITI-${new Date().getTime().toString().slice(-6)}-${random}`;
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    const term = searchTerm.toLowerCase();
    const found = devices.find(d => 
      (d.customerPhone || '').includes(term) || 
      (d.id || '').toLowerCase() === term ||
      (d.customerName || '').toLowerCase().includes(term)
    );
    if (found) {
      setSelectedDevice(found);
      setMode('view');
    } else {
      if (confirm('Không tìm thấy thiết bị nào. Bạn có muốn tạo mới hồ sơ thiết bị không?')) {
        setNewDevice({ customerPhone: searchTerm, customerName: '', specs: '' });
        setMode('add');
      }
    }
  };

  const handleScan = (text: string) => {
    setSearchTerm(text);
    const found = devices.find(d => d.id === text);
    if (found) {
      setSelectedDevice(found);
      setMode('view');
    } else {
      alert(`Mã QR hợp lệ nhưng không tìm thấy dữ liệu: ${text}`);
      setMode('search');
    }
  };

  const handleSaveDevice = async () => {
    if (!newDevice.customerName || !newDevice.customerPhone || !newDevice.specs) {
      alert("Vui lòng điền đủ tên, SĐT và cấu hình máy");
      return;
    }
    const id = generateDeviceId();
    const payload: DeviceProfile = {
      id,
      customerName: newDevice.customerName,
      customerPhone: newDevice.customerPhone,
      specs: newDevice.specs,
      created_at: new Date().toISOString(),
      search_key: `${newDevice.customerName} ${newDevice.customerPhone} ${newDevice.specs}`.toLowerCase()
    };
    
    try {
      await callSheetAPI(SHEET_API_URL, 'create_device', payload);
      setDevices(prev => [...prev, payload]);
      setSelectedDevice(payload);
      setMode('view');
      alert("Tạo hồ sơ thiết bị thành công!");
    } catch (e) {
      alert("Lỗi lưu thiết bị");
    }
  };

  const printQR = () => {
    if (!selectedDevice) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Tem in mã vạch thường là 30x20mm, 40x30mm, 50x30mm. Ta dùng flex center và scale cho vừa khổ 50mm x 30mm
      const html = `
        <html>
        <head>
          <title>In Tem QR</title>
          <style>
            @page { margin: 0; size: 50mm 30mm; }
            body { 
              margin: 0; padding: 0; 
              width: 50mm; height: 30mm; 
              display: flex; flex-direction: row; 
              align-items: center; justify-content: center;
              font-family: sans-serif;
              box-sizing: border-box;
              overflow: hidden;
            }
            .qr-container {
              width: 25mm;
              height: 25mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-container svg { width: 100%; height: 100%; }
            .info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding-left: 2mm;
            }
            .name { font-size: 8px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 22mm;}
            .phone { font-size: 7px; margin-top: 1px;}
            .id { font-size: 6px; margin-top: 2px; }
            .logo { width: 15px; position: absolute; top: 50%; left: 12.5mm; transform: translate(-50%, -50%); background: white; padding: 1px; border-radius: 2px;}
          </style>
        </head>
        <body>
          <div class="qr-container" style="position: relative;">
            ${document.getElementById('qr-svg-wrapper')?.innerHTML}
            <img class="logo" src="${window.location.origin}/logo.png" />
          </div>
          <div class="info">
            <div class="name">${selectedDevice.customerName}</div>
            <div class="phone">${selectedDevice.customerPhone}</div>
            <div class="id">${selectedDevice.id}</div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const deviceHistory = selectedDevice ? services.filter(s => 
    s.phone === selectedDevice.customerPhone || 
    (s.customerName === selectedDevice.customerName && s.phone === selectedDevice.customerPhone)
  ) : [];
  
  const totalSpent = deviceHistory.reduce((sum, s) => sum + Number(s.revenue || 0), 0);

  return (
    <div className="h-full bg-white rounded-[24px] shadow-card border border-slate-100 p-6 flex flex-col overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <MonitorCheck className="text-brand-500" />
          TRA CỨU LỊCH SỬ DỊCH VỤ
        </h2>
        {mode !== 'search' && (
          <button onClick={() => { setMode('search'); setSelectedDevice(null); }} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ChevronLeft size={16} /> Quay lại
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {mode === 'search' && (
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-full flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tìm theo Số điện thoại / Tên / Mã QR</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center font-bold text-lg focus:border-brand-500 focus:ring-0 outline-none transition-all"
                  placeholder="Nhập SĐT hoặc Mã..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} className="absolute right-3 top-3 p-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors">
                  <Search size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-xs font-bold text-slate-400 uppercase">HOẶC</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <button onClick={() => setMode('scan')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
              <QrCode size={20} /> QUÉT MÃ QR BẰNG CAMERA
            </button>
          </div>
        )}

        {mode === 'scan' && (
          <div className="flex flex-col items-center max-w-md mx-auto animate-in zoom-in-95">
            <QRScanner onScan={handleScan} />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-4">Đưa mã QR vào khung ngắm để tra cứu tự động</p>
          </div>
        )}

        {mode === 'add' && (
          <div className="max-w-lg mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4">Tạo Hồ Sơ Thiết Bị Mới</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tên Khách Hàng</label>
                <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-bold"
                  value={newDevice.customerName} onChange={e => setNewDevice({...newDevice, customerName: e.target.value})} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Số Điện Thoại</label>
                <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-bold"
                  value={newDevice.customerPhone} onChange={e => setNewDevice({...newDevice, customerPhone: e.target.value})} placeholder="09xxxx" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Cấu Hình Máy / Ghi chú thiết bị</label>
                <textarea className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-bold min-h-[100px] custom-scrollbar"
                  value={newDevice.specs} onChange={e => setNewDevice({...newDevice, specs: e.target.value})} placeholder="Ví dụ: Laptop Dell Vostro 3510, Core i5 1135G7, RAM 8GB, SSD 512GB..." />
              </div>
              <button onClick={handleSaveDevice} className="w-full py-4 bg-brand-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-brand-600 transition-colors">
                LƯU HỒ SƠ & TẠO QR
              </button>
            </div>
          </div>
        )}

        {mode === 'view' && selectedDevice && (
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* THÔNG TIN THIẾT BỊ & QR */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center">
                <div id="qr-svg-wrapper" className="bg-white p-2 rounded-xl shadow-sm mb-4 relative">
                  <QRCodeSVG value={selectedDevice.id} size={150} level="M" includeMargin={false} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-sm">
                    <img src="/logo.png" className="w-6 h-6 object-contain" alt="logo" />
                  </div>
                </div>
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight text-center">{selectedDevice.customerName}</h3>
                <p className="text-brand-600 font-bold text-sm tracking-widest">{selectedDevice.customerPhone}</p>
                <p className="text-slate-400 font-mono text-[10px] mt-1">{selectedDevice.id}</p>
                
                <button onClick={printQR} className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors">
                  <Printer size={16} /> IN TEM MÃ QR
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                <h4 className="text-emerald-800 font-black text-[10px] uppercase tracking-widest mb-1">CẤU HÌNH THIẾT BỊ</h4>
                <p className="text-emerald-900 font-bold text-sm whitespace-pre-wrap">{selectedDevice.specs}</p>
              </div>
            </div>

            {/* LỊCH SỬ DỊCH VỤ */}
            <div className="w-full lg:w-2/3 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                  <Wrench className="text-brand-500" size={18} /> Lịch Sử Sửa Chữa
                </h3>
                <div className="bg-brand-50 text-brand-700 px-3 py-1 rounded-lg font-bold text-xs border border-brand-100">
                  Tổng chi: {totalSpent.toLocaleString('vi-VN')} đ
                </div>
              </div>

              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-[300px]">
                {deviceHistory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Wrench size={32} className="mb-2 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-wider">Chưa có lịch sử dịch vụ nào</p>
                  </div>
                ) : (
                  deviceHistory.map(ticket => (
                    <div key={ticket.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-brand-600 font-black text-xs mr-2">{ticket.ticketNumber}</span>
                          <span className="text-slate-400 font-bold text-[10px]">{new Date(ticket.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-1 rounded-md">{ticket.status}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{ticket.content}</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                        <span className="text-xs text-slate-500">KTV: <strong className="text-slate-700">{ticket.technician}</strong></span>
                        <span className="font-black text-emerald-600">{Number(ticket.revenue).toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button 
                onClick={() => onCreateTicket(selectedDevice)}
                className="mt-4 w-full py-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle size={20} /> TẠO PHIẾU MỚI CHO MÁY NÀY
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
