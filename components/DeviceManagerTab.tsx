import React, { useState, useEffect } from 'react';
import { QrCode, Search, Printer, PlusCircle, MonitorCheck, ChevronLeft, Wrench, X, Laptop } from 'lucide-react';
import { callSheetAPI } from '../services/api.ts';
import { SHEET_API_URL } from '../constants.ts';
import { DeviceProfile, ServiceTicket, User } from '../types.ts';
import { QRScanner } from './QRScanner.tsx';
import { QRCodeSVG } from 'qrcode.react';

interface DeviceManagerTabProps {
  services: ServiceTicket[];
  currentUser: User | null;
  initialSearchTerm?: string;
  onCreateTicket: (device: DeviceProfile) => void;
}

export const DeviceManagerTab: React.FC<DeviceManagerTabProps> = ({ services, currentUser, initialSearchTerm, onCreateTicket }) => {
  const [devices, setDevices] = useState<DeviceProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'search' | 'scan' | 'customer_profile' | 'device_profile' | 'add'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  
  // States cho Customer Profile
  const [activeCustomerName, setActiveCustomerName] = useState('');
  const [activeCustomerPhone, setActiveCustomerPhone] = useState('');
  
  // State cho View Device (khi quét QR)
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
      if (Array.isArray(res)) setDevices(res);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const generateDeviceId = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DITI-${new Date().getTime().toString().slice(-6)}-${random}`;
  };

  const handleSearch = (overrideTerm?: string) => {
    const termToUse = (typeof overrideTerm === 'string' ? overrideTerm : searchTerm);
    if (!termToUse.trim()) return;
    const term = termToUse.toLowerCase();
    
    // Tìm khách trong services hoặc devices
    const foundService = services.find(s => 
      (s.phone || '').includes(term) || (s.customerName || '').toLowerCase().includes(term)
    );
    const foundDevice = devices.find(d => 
      (d.customerPhone || '').includes(term) || (d.customerName || '').toLowerCase().includes(term)
    );
    
    if (foundService || foundDevice) {
      setActiveCustomerName(foundService?.customerName || foundDevice?.customerName || '');
      setActiveCustomerPhone(foundService?.phone || foundDevice?.customerPhone || '');
      setMode('customer_profile');
    } else {
      if (confirm('Không tìm thấy dữ liệu. Tạo hồ sơ máy mới cho khách này?')) {
        setNewDevice({ customerPhone: termToUse, customerName: '', specs: '' });
        setMode('add');
      }
    }
  };

  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      // Wait slightly for devices to load if they are loading
      setTimeout(() => {
        handleSearch(initialSearchTerm);
      }, 500);
    }
  }, [initialSearchTerm]);

  const handleScan = (text: string) => {
    setSearchTerm(text);
    const found = devices.find(d => d.id === text);
    if (found) {
      setSelectedDevice(found);
      setMode('device_profile');
    } else {
      alert(`Mã QR hợp lệ nhưng không tìm thấy dữ liệu máy: ${text}`);
      setMode('search');
    }
  };

  const handleCreateQRForTicket = async (ticket: ServiceTicket) => {
    const specs = prompt("Nhập/Chỉnh sửa cấu hình máy cho phiếu này:", ticket.content || '');
    if (specs === null) return;
    if (!specs.trim()) return alert("Cấu hình không được để trống");

    const newId = generateDeviceId();
    const payload: DeviceProfile = {
      id: newId,
      customerName: ticket.customerName,
      customerPhone: ticket.phone,
      specs: specs,
      created_at: new Date().toISOString(),
      search_key: `${ticket.customerName} ${ticket.phone} ${specs}`.toLowerCase()
    };
    
    try {
      // 1. Lưu device profile mới
      await callSheetAPI(SHEET_API_URL, 'create_device', payload);
      setDevices(prev => [...prev, payload]);
      
      // 2. Cập nhật phiếu cũ để gắn deviceId vào
      const updatedTicket = { ...ticket, device_id: newId }; // format cho API
      await callSheetAPI(SHEET_API_URL, 'update', updatedTicket);
      
      // Update local services is handled by App.tsx reloading on update, but we can't trigger it here directly.
      // So user might need to refresh or the parent will handle it if we passed a reload function.
      // For now, it's fine, it will sync next time.
      
      alert(`Đã cấp mã QR [${newId}] thành công cho phiếu ${ticket.ticketNumber}`);
    } catch (e) {
      alert("Lỗi cấp mã QR");
    }
  };

  const handleSaveNewDevice = async () => {
    if (!newDevice.customerName || !newDevice.customerPhone || !newDevice.specs) {
      return alert("Vui lòng điền đủ tên, SĐT và cấu hình máy");
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
      
      // Jump to customer profile
      setActiveCustomerName(payload.customerName);
      setActiveCustomerPhone(payload.customerPhone);
      setMode('customer_profile');
      alert("Tạo hồ sơ thiết bị thành công!");
    } catch (e) {
      alert("Lỗi lưu thiết bị");
    }
  };

  const printQR = (device: DeviceProfile) => {
    // Sử dụng iframe để in thay vì window.open để tránh ghi đè DOM của Webview/Capacitor
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const svgEl = document.getElementById(`qr-svg-${device.id}`)?.innerHTML || '';
    const html = `
      <html>
      <head>
        <title>In Tem QR</title>
        <style>
          @page { margin: 0; size: 50mm 30mm; }
          body { 
            margin: 0; padding: 0; width: 50mm; height: 30mm; 
            display: flex; flex-direction: row; align-items: center; justify-content: center;
            font-family: sans-serif; box-sizing: border-box; overflow: hidden; background: white;
          }
          .qr-container { width: 25mm; height: 25mm; display: flex; align-items: center; justify-content: center; position: relative;}
          .qr-container svg { width: 100%; height: 100%; }
          .info { flex: 1; display: flex; flex-direction: column; justify-content: center; padding-left: 2mm; }
          .name { font-size: 8px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 22mm; color: black;}
          .phone { font-size: 7px; margin-top: 1px; color: black;}
          .id { font-size: 6px; margin-top: 2px; color: black;}
          .logo { width: 15px; position: absolute; top: 50%; left: 12.5mm; transform: translate(-50%, -50%); background: white; padding: 1px; border-radius: 2px;}
        </style>
      </head>
      <body>
        <div class="qr-container">
          ${svgEl}
          <img class="logo" src="${window.location.origin}/logo.png" />
        </div>
        <div class="info">
          <div class="name">${device.customerName}</div>
          <div class="phone">${device.customerPhone}</div>
          <div class="id">${device.id}</div>
        </div>
      </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error("Lỗi in:", e);
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 500);
    }
  };

  // Tính toán dữ liệu cho Customer Profile
  const customerDevices = devices.filter(d => d.customerPhone === activeCustomerPhone || (d.customerName === activeCustomerName && d.customerPhone === activeCustomerPhone));
  
  // Tất cả phiếu của khách này
  const customerTickets = services.filter(s => s.phone === activeCustomerPhone || (s.customerName === activeCustomerName && s.phone === activeCustomerPhone));
  const unlinkedTickets = customerTickets.filter(t => !t.deviceId);
  
  const totalCustomerSpent = customerTickets.reduce((sum, s) => sum + Number(s.revenue || 0), 0);

  // Tính toán dữ liệu cho Device Profile (khi quét QR)
  const deviceHistory = selectedDevice ? customerTickets.filter(t => t.deviceId === selectedDevice.id) : [];
  const deviceTotalSpent = deviceHistory.reduce((sum, s) => sum + Number(s.revenue || 0), 0);

  return (
    <div className="h-full bg-white rounded-[24px] shadow-card border border-slate-100 p-6 flex flex-col overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <MonitorCheck className="text-brand-500" />
          TRA CỨU MÁY & LỊCH SỬ
        </h2>
        {mode !== 'search' && (
          <button onClick={() => { setMode('search'); setSelectedDevice(null); }} className="diti-back-btn px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ChevronLeft size={16} /> Quay lại
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {mode === 'search' && (
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-full flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tìm theo SĐT hoặc Tên</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center font-bold text-lg focus:border-brand-500 focus:ring-0 outline-none transition-all"
                  placeholder="Nhập SĐT..."
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
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-4">Đưa mã QR vào khung ngắm để tra cứu thiết bị</p>
          </div>
        )}

        {mode === 'add' && (
          <div className="max-w-lg mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4">Thêm Thiết Bị Mới</h3>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Cấu Hình Máy / Ghi chú</label>
                <textarea className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-bold min-h-[100px] custom-scrollbar"
                  value={newDevice.specs} onChange={e => setNewDevice({...newDevice, specs: e.target.value})} placeholder="Ví dụ: Laptop Dell Vostro 3510, Core i5 1135G7..." />
              </div>
              <button onClick={handleSaveNewDevice} className="w-full py-4 bg-brand-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-brand-600 transition-colors">
                LƯU HỒ SƠ & TẠO QR
              </button>
            </div>
          </div>
        )}

        {/* MÀN HÌNH HỒ SƠ KHÁCH HÀNG CHUYÊN SÂU */}
        {mode === 'customer_profile' && (
          <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg shadow-brand-500/20">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{activeCustomerName || 'Khách hàng'}</h3>
                <p className="text-brand-100 font-bold tracking-widest">{activeCustomerPhone}</p>
              </div>
              <div className="text-right">
                <p className="text-brand-100 text-xs font-bold uppercase tracking-wider mb-1">Tổng chi tiêu</p>
                <p className="text-2xl font-black">{totalCustomerSpent.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <h4 className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <QrCode className="text-brand-500" size={18} /> CÁC THIẾT BỊ ĐÃ CẤP MÃ QR ({customerDevices.length})
              </h4>
              <button 
                onClick={() => { setNewDevice({ customerName: activeCustomerName, customerPhone: activeCustomerPhone, specs: '' }); setMode('add'); }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800"
              >
                <PlusCircle size={16}/> Thêm máy mới cho khách này
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerDevices.length === 0 ? (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <Laptop size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-wider">Khách hàng chưa có thiết bị nào được cấp QR</p>
                </div>
              ) : (
                customerDevices.map(dev => (
                  <div key={dev.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div id={`qr-svg-${dev.id}`} className="bg-white p-1 rounded-lg shadow-sm relative w-[60px] h-[60px]">
                        <QRCodeSVG value={dev.id} size={52} level="M" includeMargin={false} />
                      </div>
                      <button onClick={() => printQR(dev)} className="text-brand-600 bg-brand-50 hover:bg-brand-100 p-2 rounded-xl transition-colors" title="In tem mã vạch">
                        <Printer size={16} />
                      </button>
                    </div>
                    <p className="text-slate-800 font-bold text-sm mb-1">{dev.specs}</p>
                    <p className="text-slate-400 font-mono text-[9px] mb-3">{dev.id}</p>
                    
                    <button 
                      onClick={() => onCreateTicket(dev)}
                      className="mt-auto w-full py-2.5 bg-white border border-brand-200 text-brand-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-brand-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <PlusCircle size={14} /> Tạo phiếu mới
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <h4 className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Wrench className="text-orange-500" size={18} /> PHIẾU SỬA CHỮA CŨ CHƯA CẤP QR ({unlinkedTickets.length})
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 overflow-y-auto max-h-[400px] custom-scrollbar flex flex-col gap-2">
                {unlinkedTickets.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-wider">Không có phiếu cũ nào chưa cấp mã</p>
                  </div>
                ) : (
                  unlinkedTickets.map(ticket => (
                    <div key={ticket.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-brand-600 font-black text-sm">{ticket.ticketNumber}</span>
                          <span className="text-slate-400 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">{new Date(ticket.created_at).toLocaleDateString('vi-VN')}</span>
                          <span className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-md">{ticket.status}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-700">{ticket.content}</p>
                        <p className="text-xs text-slate-500 mt-1">Chi phí: <strong className="text-emerald-600">{Number(ticket.revenue).toLocaleString('vi-VN')} đ</strong></p>
                      </div>
                      <button onClick={() => handleCreateQRForTicket(ticket)} className="shrink-0 py-2.5 px-4 bg-orange-50 text-orange-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-orange-100 transition-colors border border-orange-200">
                        CẤP QR CHO PHIẾU NÀY
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MÀN HÌNH CHI TIẾT THIẾT BỊ (KHI QUÉT QR) */}
        {mode === 'device_profile' && selectedDevice && (
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center">
                <div id={`qr-svg-${selectedDevice.id}`} className="bg-white p-2 rounded-xl shadow-sm mb-4 relative">
                  <QRCodeSVG value={selectedDevice.id} size={150} level="M" includeMargin={false} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-sm">
                    <img src="/logo.png" className="w-6 h-6 object-contain" alt="logo" />
                  </div>
                </div>
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight text-center">{selectedDevice.customerName}</h3>
                <p className="text-brand-600 font-bold text-sm tracking-widest">{selectedDevice.customerPhone}</p>
                <p className="text-slate-400 font-mono text-[10px] mt-1">{selectedDevice.id}</p>
                
                <button onClick={() => printQR(selectedDevice)} className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors">
                  <Printer size={16} /> IN TEM MÃ QR
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                <h4 className="text-emerald-800 font-black text-[10px] uppercase tracking-widest mb-1">CẤU HÌNH THIẾT BỊ</h4>
                <p className="text-emerald-900 font-bold text-sm whitespace-pre-wrap">{selectedDevice.specs}</p>
              </div>
            </div>

            <div className="w-full lg:w-2/3 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                  <Wrench className="text-brand-500" size={18} /> Lịch Sử Sửa Chữa Máy Này
                </h3>
                <div className="bg-brand-50 text-brand-700 px-3 py-1 rounded-lg font-bold text-xs border border-brand-100">
                  Tổng chi: {deviceTotalSpent.toLocaleString('vi-VN')} đ
                </div>
              </div>

              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-[300px]">
                {deviceHistory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Wrench size={32} className="mb-2 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-wider">Chưa có phiếu nào gắn mã này</p>
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
                <PlusCircle size={20} /> TẠO PHIẾU SỬA MỚI CHO MÁY NÀY
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
