
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Activity, User, Phone, MapPin, ReceiptText, X, Share2, MessageSquare, Download, CheckCircle2, Copy, Sparkles, Loader2, Camera, Save, ArrowLeft, RefreshCw
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { ServiceFormData, PriceItem, ServiceTicket } from '../types.ts';
import { STATUS_OPTIONS } from '../constants.ts';
import { formatCurrency, parseCurrency } from '../utils/helpers.ts';
import { InvoiceTemplate } from './InvoiceTemplate.tsx';
import { diagnoseServiceAction } from '../services/ai.ts';

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
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAiDiagnosing, setIsAiDiagnosing] = useState(false);
  
  const billRef = useRef<HTMLDivElement>(null);

  const customerSuggestions = useMemo(() => {
    const customers: Record<string, { name: string, address: string }> = {};
    if (Array.isArray(services)) {
      services.forEach(s => {
        const phone = String(s.phone || '').trim();
        if (phone.length >= 3 && !customers[phone]) {
          customers[phone] = { name: s.customerName || '', address: s.address || '' };
        }
      });
    }
    return Object.entries(customers).map(([phone, info]) => ({ phone, ...info }));
  }, [services]);

  const filteredCustomerSuggestions = useMemo(() => {
    const term = (formData.phone || '').trim();
    if (term.length < 3) return [];
    return customerSuggestions.filter(c => c.phone.includes(term)).slice(0, 5);
  }, [customerSuggestions, formData.phone]);

  const updateField = (f: keyof ServiceFormData, v: any) => {
    setFormData(prev => ({ ...prev, [f]: v }));
  };

  const selectCustomer = (c: { phone: string, name: string, address: string }) => {
    setFormData(prev => ({ ...prev, phone: c.phone, customerName: c.name, address: c.address }));
    setShowPhoneSuggestions(false);
  };

  const updateWorkItem = (idx: number, f: string, v: any) => {
    setFormData(prev => {
      const items = Array.isArray(prev.workItems) ? [...prev.workItems] : [];
      if (!items[idx]) return prev;

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

  const handleAiDiagnose = async () => {
    if (!formData.content) return showTemporaryStatus("Vui lòng nhập nội dung lỗi");
    setIsAiDiagnosing(true);
    try {
      const suggestions = await diagnoseServiceAction(formData.content);
      if (suggestions && suggestions.length > 0) {
        const newItems = suggestions.map((s: any) => ({ ...s, total: s.qty * s.price }));
        const newRevenue = newItems.reduce((acc: number, cur: any) => acc + cur.total, 0);
        setFormData(prev => ({
          ...prev, workItems: newItems, revenue: newRevenue,
          debt: prev.status === 'Hoàn thành' ? 0 : newRevenue
        }));
        showTemporaryStatus("AI đã báo giá hoàn tất!");
      }
    } catch (e: any) { alert(e.message); } 
    finally { setIsAiDiagnosing(false); }
  };

  const handleCaptureBill = async () => {
    if (!billRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 800)); // Chờ render hoàn tất
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      setCapturedDataUrl(canvas.toDataURL('image/png'));
      showTemporaryStatus("Đã tạo ảnh hóa đơn!");
    } catch (err) {
      alert("Lỗi khi tạo ảnh hóa đơn.");
    } finally {
      setIsCapturing(false);
    }
  };

  const showTemporaryStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const inputStyle = "w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-400 font-medium transition-all text-slate-800";
  const moneyInputStyle = "w-full p-2 bg-white border border-slate-100 rounded-xl outline-none focus:border-blue-400 font-black text-slate-800 text-[10px] text-center";

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10001] bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest animate-in fade-in zoom-in shadow-2xl flex items-center gap-2">
          <Sparkles size={14} className="text-yellow-400" /> {statusMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider text-sm">
          <Activity size={18} className="text-blue-500"/> {selectedId ? 'Cập nhật phiếu' : 'Tiếp nhận mới'}
        </h2>
        <div className="flex gap-1">
          {selectedId && <button onClick={onClear} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><RefreshCw size={18}/></button>}
          {selectedId && isAdmin && (
            <button onClick={onDelete} disabled={isSubmitting} className="text-red-400 p-2 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20}/></button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Phone className="absolute left-3.5 top-3 text-slate-400 z-10" size={16} />
          <input type="tel" placeholder="Số điện thoại" className={inputStyle} value={formData.phone || ''} onChange={e => { updateField('phone', e.target.value); setShowPhoneSuggestions(true); }} onFocus={() => setShowPhoneSuggestions(true)} onBlur={() => setTimeout(() => setShowPhoneSuggestions(false), 200)} />
          {showPhoneSuggestions && filteredCustomerSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-2xl z-[60] max-h-56 overflow-auto rounded-2xl mt-1">
              {filteredCustomerSuggestions.map((c, i) => (
                <div key={i} onMouseDown={() => selectCustomer(c)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors flex justify-between">
                  <span className="font-black text-blue-600 text-xs">{c.phone}</span>
                  <span className="font-bold text-slate-800 text-xs">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="relative"><User className="absolute left-3.5 top-3 text-slate-400 z-10" size={16} /><input type="text" placeholder="Tên khách hàng" className={inputStyle} value={formData.customerName || ''} onChange={e => updateField('customerName', e.target.value)} /></div>
        <div className="relative"><MapPin className="absolute left-3.5 top-3 text-slate-400 z-10" size={16} /><input type="text" placeholder="Địa chỉ" className={inputStyle} value={formData.address || ''} onChange={e => updateField('address', e.target.value)} /></div>

        <div className="relative group">
          <MessageSquare className="absolute left-3.5 top-3.5 text-slate-400 z-10" size={16} />
          <textarea placeholder="Mô tả lỗi hoặc yêu cầu khách hàng..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl min-h-[100px] focus:bg-white focus:border-blue-400 outline-none transition-all" value={formData.content || ''} onChange={e => updateField('content', e.target.value)} />
          <button onClick={handleAiDiagnose} disabled={isAiDiagnosing || !formData.content} className={`absolute right-3 bottom-3 flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md ${isAiDiagnosing ? 'bg-slate-200 text-slate-400' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'}`}>
            {isAiDiagnosing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI BÁO GIÁ
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none" value={formData.status} onChange={e => updateField('status', e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none disabled:opacity-50" value={formData.technician || ''} onChange={e => updateField('technician', e.target.value)} disabled={!isAdmin}>
            <option value="">Kỹ thuật viên</option>
            {technicians.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="pt-2">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Dịch vụ & Linh kiện</span>
            <button onClick={() => setFormData(p => ({...p, workItems: Array.isArray(p.workItems) ? [...p.workItems, {desc: '', qty: 1, price: '', total: 0}] : [{desc: '', qty: 1, price: '', total: 0}]}))} className="text-blue-500 p-1 hover:bg-blue-50 rounded-lg"><Plus size={18}/></button>
          </div>
          <div className="space-y-2">
            {Array.isArray(formData.workItems) && formData.workItems.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2 group hover:border-blue-100 transition-all">
                <input type="text" placeholder="Tên dịch vụ..." className="w-full bg-transparent font-bold text-slate-800 outline-none border-b border-transparent focus:border-blue-200 text-[13px]" value={item.desc || ''} onChange={e => updateWorkItem(idx, 'desc', e.target.value)} />
                <div className="flex gap-2 text-[11px] font-bold">
                  <div className="flex-1 bg-white border border-slate-100 p-1.5 rounded-lg flex items-center gap-1">SL: <input type="number" className="w-full outline-none font-black text-center bg-transparent" value={item.qty || 1} onChange={e => updateWorkItem(idx, 'qty', e.target.value)} /></div>
                  <div className="flex-[2] bg-white border border-slate-100 p-1.5 rounded-lg px-2 text-right"><input type="text" className="w-full outline-none font-black text-right text-blue-600 bg-transparent" value={formatCurrency(item.price)} onChange={e => updateWorkItem(idx, 'price', e.target.value)} /></div>
                  <button onClick={() => setFormData(p => ({...p, workItems: p.workItems.filter((_, i) => i !== idx)}))} className="text-slate-300 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 grid grid-cols-3 gap-3 bg-slate-100/40 p-4 rounded-[32px] border border-slate-100">
          <div className="text-center"><span className="text-[9px] font-black text-blue-500 uppercase">Doanh thu</span><input type="text" className={`${moneyInputStyle} text-blue-600`} value={formatCurrency(formData.revenue)} readOnly /></div>
          <div className="text-center"><span className="text-[9px] font-black text-orange-500 uppercase">Giá vốn</span><input type="text" className={`${moneyInputStyle} text-orange-600`} value={formatCurrency(formData.cost)} onChange={e => updateField('cost', parseCurrency(e.target.value))} /></div>
          <div className="text-center"><span className="text-[9px] font-black text-red-500 uppercase">Công nợ</span><input type="text" className={`${moneyInputStyle} text-red-600`} value={formatCurrency(formData.debt)} onChange={e => updateField('debt', parseCurrency(e.target.value))} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4">
        {!selectedId ? (
          <button disabled={isSubmitting} onClick={onSave} className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-[12px] active:scale-95 transition-all">
            {isSubmitting ? 'ĐANG LƯU...' : 'LƯU PHIẾU MỚI'}
          </button>
        ) : (
          <>
            <button disabled={isSubmitting} onClick={onUpdate} className="bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-[12px] active:scale-95 transition-all">CẬP NHẬT</button>
            <button onClick={onClear} className="bg-slate-100 text-slate-600 font-black py-4 rounded-2xl uppercase text-[12px] active:scale-95 transition-all">TIẾP MỚI</button>
          </>
        )}
      </div>

      {selectedId && (
        <button onClick={() => { setShowBill(true); setCapturedDataUrl(null); }} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-2xl uppercase shadow-md flex items-center justify-center gap-3 text-[12px] transition-all">
          <ReceiptText size={20}/> XUẤT HÓA ĐƠN
        </button>
      )}

      {showBill && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex flex-col p-4 animate-in fade-in">
          <div className="max-w-md w-full mx-auto flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setShowBill(false)} className="flex items-center gap-2 text-white/70 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"><ArrowLeft size={16}/> Quay lại</button>
              <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs">Hóa đơn điện tử</h3>
              <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100 rounded-[40px] p-4 shadow-2xl flex flex-col items-center">
              {!capturedDataUrl ? (
                <>
                  <div ref={billRef} className="bg-white rounded-3xl overflow-hidden shadow-sm p-1">
                    <InvoiceTemplate formData={formData} bankInfo={bankInfo} />
                  </div>
                  <div className="w-full mt-8 px-4">
                    <button onClick={handleCaptureBill} disabled={isCapturing} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">
                      {isCapturing ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />} TẠO ẢNH CHIA SẺ
                    </button>
                  </div>
                </>
              ) : (
                <div className="animate-in zoom-in duration-300 w-full flex flex-col items-center px-2">
                   <img src={capturedDataUrl} alt="Invoice" className="w-full rounded-2xl shadow-xl border border-white/50 mb-8" />
                   <div className="w-full space-y-3 pb-8">
                      <button onClick={async () => {
                        const blob = await (await fetch(capturedDataUrl)).blob();
                        const file = new File([blob], `Bill_${formData.customerName}.png`, { type: 'image/png' });
                        if (navigator.share && navigator.canShare?.({ files: [file] })) {
                          await navigator.share({ files: [file], title: 'Hóa đơn Diticoms', text: `Gửi hóa đơn cho ${formData.customerName}` });
                        } else {
                          const link = document.createElement('a');
                          link.download = `Bill_${formData.customerName}.png`;
                          link.href = capturedDataUrl;
                          link.click();
                        }
                      }} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
                        <Share2 size={20} /> CHIA SẺ NGAY
                      </button>
                      <button onClick={() => setCapturedDataUrl(null)} className="w-full text-slate-400 font-bold py-3 uppercase text-[10px] tracking-widest">
                        QUAY LẠI CHỈNH SỬA
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
