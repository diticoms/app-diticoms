
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Activity, User, Phone, MapPin, ReceiptText, X, Share2, MessageSquare, Download, Image as ImageIcon, CheckCircle2, Copy
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { ServiceFormData, PriceItem, ServiceTicket } from '../types.ts';
import { STATUS_OPTIONS } from '../constants.ts';
import { formatCurrency, parseCurrency } from '../utils/helpers.ts';
import { InvoiceTemplate } from './InvoiceTemplate.tsx';

interface Props {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  technicians: string[];
  priceList: PriceItem[];
  selectedId: string | null;
  isSubmitting: boolean;
  currentUser: any;
  onSave: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onClear: () => void;
  services: ServiceTicket[];
  bankInfo?: any;
}

export const ServiceForm: React.FC<Props> = ({
  formData, setFormData, technicians, priceList, selectedId, isSubmitting, 
  currentUser, onSave, onUpdate, onDelete, onClear, services, bankInfo
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const billRef = useRef<HTMLDivElement>(null);

  const customerSuggestions = useMemo(() => {
    const customers: Record<string, { name: string, address: string }> = {};
    const sortedServices = [...services].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    sortedServices.forEach(s => {
      const phone = String(s.phone || '').trim();
      if (phone.length >= 3) {
        if (!customers[phone]) {
          customers[phone] = { 
            name: s.customerName || '', 
            address: s.address || '' 
          };
        }
      }
    });
    return Object.entries(customers).map(([phone, info]) => ({ phone, ...info }));
  }, [services]);

  const filteredCustomerSuggestions = useMemo(() => {
    const term = formData.phone.trim();
    if (term.length < 3) return [];
    return customerSuggestions.filter(c => 
      c.phone.includes(term)
    ).slice(0, 5);
  }, [customerSuggestions, formData.phone]);

  const updateField = (f: keyof ServiceFormData, v: any) => {
    setFormData(prev => {
      const newState = { ...prev, [f]: v };
      if (f === 'status') {
        if (v === 'Hoàn thành') {
          newState.debt = 0;
        } else {
          newState.debt = newState.revenue;
        }
      }
      return newState;
    });
  };

  const selectCustomer = (c: { phone: string, name: string, address: string }) => {
    setFormData(prev => ({
      ...prev,
      phone: c.phone,
      customerName: c.name,
      address: c.address
    }));
    setShowPhoneSuggestions(false);
  };

  const updateWorkItem = (idx: number, f: string, v: any) => {
    setFormData(prev => {
      const items = [...prev.workItems];
      const item = { ...items[idx], [f]: v };
      const price = parseCurrency(f === 'price' ? v : item.price);
      const qty = Number(f === 'qty' ? v : item.qty);
      item.total = price * qty;
      items[idx] = item;
      
      const newRevenue = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
      return { 
        ...prev, 
        workItems: items, 
        revenue: newRevenue,
        debt: prev.status === 'Hoàn thành' ? 0 : newRevenue 
      };
    });
  };

  const handlePrepareShare = async () => {
    if (!billRef.current) return;
    setIsCapturing(true);
    try {
      // Chờ ảnh QR được tải hoàn toàn
      const images = billRef.current.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      const canvas = await html2canvas(billRef.current, { 
        scale: 2.5, // Giảm nhẹ scale để tối ưu dung lượng cho APK
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      setCapturedDataUrl(dataUrl);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setShowSharePopup(true);
        }
      }, 'image/png', 0.9);
    } catch (e) { 
      console.error(e);
      alert("Không thể chụp hóa đơn. Vui lòng thử lại hoặc chụp màn hình thủ công."); 
    } finally { 
      setIsCapturing(false); 
    }
  };

  const handleDownload = () => {
    if (!capturedDataUrl) return;
    const fileName = `Bill_${(formData.customerName || 'Khach').toUpperCase().replace(/\s+/g, '_')}.png`;
    
    try {
      const link = document.createElement('a');
      link.href = capturedDataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showTemporaryStatus("Đã bắt đầu tải xuống");
    } catch (e) {
      // Fallback cho một số trình duyệt Android WebView kén lệnh download
      window.open(capturedDataUrl, '_blank');
      showTemporaryStatus("Mở ảnh trong tab mới");
    }
  };

  const handleCopyImage = async () => {
    if (!capturedBlob) return;
    try {
      const data = [new ClipboardItem({ [capturedBlob.type]: capturedBlob })];
      await navigator.clipboard.write(data);
      showTemporaryStatus("Đã chép ảnh vào bộ nhớ");
    } catch (err) {
      showTemporaryStatus("Lỗi copy: Nhấn giữ ảnh để lưu");
    }
  };

  const handleNativeShare = async () => {
    if (!capturedBlob) return;
    const fileName = `Bill_${(formData.customerName || 'Khach').toUpperCase().replace(/\s+/g, '_')}.png`;
    const file = new File([capturedBlob], fileName, { type: 'image/png' });

    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Hóa đơn Diticoms',
          text: `Gửi hóa đơn khách hàng: ${formData.customerName}`
        });
      } else if (navigator.share) {
        // Share văn bản nếu không hỗ trợ share file
        await navigator.share({
          title: 'Diticoms Service',
          text: `Hóa đơn: ${formData.customerName}\nTổng: ${formatCurrency(formData.revenue)}đ`,
          url: window.location.href
        });
      } else {
        handleDownload();
      }
    } catch (e) {
      console.error("Share error", e);
      handleDownload();
    }
  };

  const showTemporaryStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const inputStyle = "w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-400 font-medium transition-all text-slate-800";
  const moneyInputStyle = "w-full p-2 bg-white border border-slate-100 rounded-xl outline-none focus:border-blue-400 font-black text-slate-800 text-[10px] text-center";

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10001] bg-blue-600 text-white px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl animate-in fade-in zoom-in">
          {statusMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider text-sm">
          <Activity size={18} className="text-blue-500"/> {selectedId ? 'Cập nhật phiếu' : 'Tiếp nhận mới'}
        </h2>
        {selectedId && isAdmin && (
          <button onClick={onDelete} disabled={isSubmitting} className="text-red-400 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20}/></button>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Phone className="absolute left-3.5 top-3 text-slate-400 z-10" size={16} />
          <input 
            type="tel" 
            placeholder="Số điện thoại" 
            className={inputStyle} 
            value={formData.phone} 
            onChange={e => {
              updateField('phone', e.target.value);
              setShowPhoneSuggestions(true);
            }} 
            onFocus={() => setShowPhoneSuggestions(true)}
            onBlur={() => setTimeout(() => setShowPhoneSuggestions(false), 200)}
          />
          {showPhoneSuggestions && filteredCustomerSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-2xl z-[60] max-h-56 overflow-auto rounded-2xl mt-1 animate-in fade-in zoom-in duration-150">
              <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Gợi ý từ lịch sử</span>
              </div>
              {filteredCustomerSuggestions.map((c, i) => (
                <div key={i} onMouseDown={() => selectCustomer(c)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors flex flex-col">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-black text-blue-600 text-xs">{c.phone}</span>
                    <span className="font-bold text-slate-800 text-xs">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                    <MapPin size={10} />
                    <span className="truncate">{c.address || 'Không có địa chỉ'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <User className="absolute left-3.5 top-3 text-slate-400 z-10" size={16} />
          <input type="text" placeholder="Tên khách hàng" className={inputStyle} value={formData.customerName} onChange={e => updateField('customerName', e.target.value)} />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-3 text-slate-400 z-10" size={16} />
          <input type="text" placeholder="Địa chỉ" className={inputStyle} value={formData.address} onChange={e => updateField('address', e.target.value)} />
        </div>
        <div className="relative">
          <MessageSquare className="absolute left-3.5 top-3.5 text-slate-400 z-10" size={16} />
          <textarea placeholder="Yêu cầu dịch vụ..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl min-h-[80px] focus:bg-white focus:border-blue-400 outline-none" value={formData.content} onChange={e => updateField('content', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold appearance-none text-slate-700 outline-none" value={formData.status} onChange={e => updateField('status', e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold appearance-none text-slate-700 outline-none" value={formData.technician} onChange={e => updateField('technician', e.target.value)} disabled={!isAdmin}>
            <option value="">Kỹ thuật viên</option>
            {technicians.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="pt-2">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Dịch vụ & Linh kiện</span>
            <button onClick={() => setFormData(p => ({...p, workItems: [...p.workItems, {desc: '', qty: 1, price: '', total: 0}]}))} className="text-blue-500 p-1 hover:bg-blue-50 rounded-lg"><Plus size={18}/></button>
          </div>
          <div className="space-y-2">
            {formData.workItems.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2 relative group hover:border-blue-100 transition-all">
                <input 
                  type="text" placeholder="Tên dịch vụ..." className="w-full bg-transparent font-bold text-slate-800 outline-none border-b border-transparent focus:border-blue-200" 
                  value={item.desc} onChange={e => updateWorkItem(idx, 'desc', e.target.value)} 
                />
                <div className="flex gap-2 text-[11px] font-bold">
                  <div className="flex-1 bg-white border border-slate-100 p-1.5 rounded-lg px-2 flex items-center gap-1">SL: <input type="number" className="w-full outline-none font-black text-center bg-transparent" value={item.qty} onChange={e => updateWorkItem(idx, 'qty', e.target.value)} /></div>
                  <div className="flex-[2] bg-white border border-slate-100 p-1.5 rounded-lg px-2 text-right"><input type="text" className="w-full outline-none font-black text-right text-blue-600 bg-transparent" value={formatCurrency(item.price)} onChange={e => updateWorkItem(idx, 'price', e.target.value)} /></div>
                  <button onClick={() => setFormData(p => ({...p, workItems: p.workItems.filter((_, i) => i !== idx)}))} className="text-slate-300 hover:text-red-400 transition-colors p-1"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 space-y-2 bg-slate-100/40 p-3 rounded-[24px] border border-slate-100">
           <div className="flex items-center gap-2 px-1 mb-1">
              <span className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">Thông tin tài chính</span>
           </div>
           <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 text-center">
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">Tổng thu</span>
                <input type="text" className={`${moneyInputStyle} text-blue-600 bg-slate-50`} value={formatCurrency(formData.revenue)} readOnly />
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span className="text-[8px] font-black text-orange-500 uppercase tracking-tighter">Vốn</span>
                <input type="text" className={`${moneyInputStyle} text-orange-600`} value={formatCurrency(formData.cost)} onChange={e => updateField('cost', parseCurrency(e.target.value))} />
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Công nợ</span>
                <input type="text" className={`${moneyInputStyle} text-red-600`} value={formatCurrency(formData.debt)} onChange={e => updateField('debt', parseCurrency(e.target.value))} />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        {!selectedId ? (
          <button disabled={isSubmitting} onClick={onSave} className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg uppercase tracking-wider text-[12px] active:scale-95 transition-all">
            {isSubmitting ? 'ĐANG LƯU...' : 'LƯU PHIẾU MỚI'}
          </button>
        ) : (
          <>
            <button disabled={isSubmitting} onClick={onUpdate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl uppercase text-[12px] active:scale-95 transition-all">CẬP NHẬT</button>
            <button onClick={onClear} className="bg-slate-100 text-slate-600 font-bold py-4 rounded-xl uppercase text-[12px] active:scale-95 transition-all">TIẾP MỚI</button>
          </>
        )}
      </div>

      {selectedId && (
        <button onClick={() => setShowBill(true)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl uppercase shadow-md flex items-center justify-center gap-2 text-[12px] transition-all">
          <ReceiptText size={18}/> XEM HÓA ĐƠN
        </button>
      )}

      {showBill && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 safe-area-padding">
          <div className="bg-white rounded-[40px] p-2 max-w-[360px] w-full max-h-[95vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowBill(false)} className="absolute top-4 right-4 p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 z-[10001] transition-colors"><X size={20}/></button>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/30 flex justify-center rounded-t-[38px]">
              <div ref={billRef} className="bg-white shadow-xl h-fit">
                <InvoiceTemplate formData={formData} bankInfo={bankInfo} />
              </div>
            </div>
            <div className="p-4 bg-white grid grid-cols-2 gap-3 rounded-b-[40px] border-t border-slate-50">
              <button onClick={handlePrepareShare} disabled={isCapturing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl uppercase text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                {isCapturing ? 'ĐANG XỬ LÝ...' : 'LƯU / CHIA SẺ'}
              </button>
              <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl uppercase text-[11px] active:scale-95 transition-all shadow-lg">IN HÓA ĐƠN</button>
            </div>
          </div>
        </div>
      )}

      {showSharePopup && (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-6 space-y-5 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs flex items-center gap-2">
                <Share2 size={16} className="text-blue-500" /> TÙY CHỌN HÓA ĐƠN
              </h3>
              <button onClick={() => setShowSharePopup(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
            </div>

            <div className="bg-slate-50 p-2 rounded-3xl border border-slate-100 relative group overflow-hidden">
               {capturedDataUrl && (
                 <img 
                   src={capturedDataUrl} 
                   alt="Preview Bill" 
                   className="w-full h-auto rounded-2xl shadow-sm max-h-[300px] object-contain mx-auto"
                   onContextMenu={(e) => e.stopPropagation()} 
                 />
               )}
               <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/60 text-white text-[8px] px-3 py-1 rounded-full backdrop-blur-sm font-bold uppercase">Nhấn giữ ảnh để lưu thủ công</span>
               </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleDownload} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 border border-slate-100 transition-all active:scale-95">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Download size={20} className="text-slate-600" />
                </div>
                <span className="font-bold text-[9px] text-slate-600 uppercase">Lưu File</span>
              </button>

              <button onClick={handleCopyImage} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 border border-slate-100 transition-all active:scale-95">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Copy size={20} className="text-slate-600" />
                </div>
                <span className="font-bold text-[9px] text-slate-600 uppercase">Sao chép</span>
              </button>
              
              <button onClick={handleNativeShare} className="flex flex-col items-center gap-2 p-4 bg-blue-600 rounded-2xl hover:bg-blue-700 border border-blue-500 transition-all active:scale-95">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-sm">
                  <Share2 size={20} className="text-white" />
                </div>
                <span className="font-bold text-[9px] text-white uppercase">Chia sẻ</span>
              </button>
            </div>
            
            <div className="bg-blue-50/50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={16} className="text-blue-600" />
              </div>
              <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                Hóa đơn đã được tạo thành công. Bạn có thể <b>Tải xuống</b>, <b>Sao chép</b> hoặc <b>Chia sẻ</b> trực tiếp qua Zalo. Nếu nút không hoạt động (đối với APK), hãy <b>nhấn giữ vào ảnh</b> phía trên để lưu.
              </p>
            </div>

            <button onClick={() => setShowSharePopup(false)} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl uppercase text-[11px] active:scale-95 transition-all">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};
