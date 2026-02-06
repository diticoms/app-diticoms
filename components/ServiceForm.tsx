
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Activity, User, Phone, MapPin, ReceiptText, X, Share2, MessageSquare
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
  const [activeWorkIdx, setActiveWorkIdx] = useState<number | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const billRef = useRef<HTMLDivElement>(null);

  const historySuggestions = useMemo(() => {
    const sugg: Record<string, number> = {};
    services.forEach(s => {
      const items = Array.isArray(s.workItems) ? s.workItems : [];
      items.forEach((i: any) => {
        if(i.desc) sugg[i.desc.trim()] = Number(i.price) || 0;
      });
    });
    priceList.forEach(p => sugg[p.name.trim()] = p.price);
    return Object.entries(sugg).map(([name, price]) => ({ name, price }));
  }, [services, priceList]);

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

  const handleShareOrSave = async () => {
    if (!billRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(billRef.current, { scale: 3, useCORS: true });
      const fileName = `Bill_${(formData.customerName || 'Khach').toUpperCase()}.png`;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Invoice' });
            return;
          }
        }
        const link = document.createElement('a');
        link.href = canvas.toDataURL();
        link.download = fileName;
        link.click();
      });
    } catch (e) { alert("Lỗi khi tạo hóa đơn"); }
    finally { setIsCapturing(false); }
  };

  const inputStyle = "w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-400 font-medium transition-all text-slate-800";
  const moneyInputStyle = "w-full p-2 bg-white border border-slate-100 rounded-xl outline-none focus:border-blue-400 font-black text-slate-800 text-[10px] text-center";

  return (
    <div className="space-y-6">
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
          <input type="tel" placeholder="Số điện thoại" className={inputStyle} value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
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
                  value={item.desc} onFocus={() => setActiveWorkIdx(idx)} onChange={e => updateWorkItem(idx, 'desc', e.target.value)} 
                  onBlur={() => setTimeout(() => setActiveWorkIdx(null), 200)} 
                />
                {activeWorkIdx === idx && historySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 shadow-2xl z-50 max-h-40 overflow-auto rounded-xl mt-1">
                    {historySuggestions.filter(p => p.name.toLowerCase().includes(item.desc.toLowerCase())).map((p, i) => (
                      <div key={i} onMouseDown={() => { updateWorkItem(idx, 'desc', p.name); updateWorkItem(idx, 'price', p.price); }} className="p-2.5 hover:bg-slate-50 text-xs flex justify-between border-b last:border-0 font-medium cursor-pointer">
                        <span>{p.name}</span>
                        <span className="font-bold text-blue-500">{formatCurrency(p.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-2 max-w-[360px] w-full max-h-[95vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowBill(false)} className="absolute top-4 right-4 p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 z-[1000001] transition-colors"><X size={20}/></button>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/30 flex justify-center rounded-t-[38px]">
              <div ref={billRef} className="bg-white shadow-xl h-fit">
                <InvoiceTemplate formData={formData} bankInfo={bankInfo} />
              </div>
            </div>
            <div className="p-4 bg-white grid grid-cols-2 gap-3 rounded-b-[40px] border-t border-slate-50">
              <button onClick={handleShareOrSave} disabled={isCapturing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl uppercase text-[11px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                {isCapturing ? 'ĐANG TẠO...' : 'LƯU / CHIA SẺ'}
              </button>
              <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl uppercase text-[11px] active:scale-95 transition-all shadow-lg">IN HÓA ĐƠN</button>
              <button onClick={() => setShowBill(false)} className="col-span-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl uppercase text-[11px] transition-all">ĐÓNG</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
