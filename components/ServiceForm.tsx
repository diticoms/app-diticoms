
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Save, RefreshCw, Activity, 
  User, Phone, MapPin, ChevronDown, ReceiptText, X, Download, MessageSquare
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { ServiceFormData, PriceItem, ServiceTicket, WorkItem } from '../types.ts';
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
  const [phoneSuggestions, setPhoneSuggestions] = useState<ServiceTicket[]>([]);
  const [activeWorkIdx, setActiveWorkIdx] = useState<number | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const billRef = useRef<HTMLDivElement>(null);

  // Thu thập tất cả các workItems từ lịch sử để gợi ý
  const historyWorkSuggestions = useMemo(() => {
    const suggestions: Record<string, number> = {};
    services.forEach(s => {
      const items = Array.isArray(s.workItems) ? s.workItems : [];
      items.forEach((item: any) => {
        if (item.desc) {
          suggestions[item.desc.trim()] = Number(item.price) || 0;
        }
      });
    });
    
    // Gộp với priceList hiện tại
    priceList.forEach(p => {
      suggestions[p.name.trim()] = p.price;
    });

    return Object.entries(suggestions).map(([name, price]) => ({ name, price }));
  }, [services, priceList]);

  useEffect(() => {
    if (!isAdmin && currentUser?.associatedTech && !formData.technician) {
      setFormData(prev => ({ ...prev, technician: currentUser.associatedTech }));
    }
  }, [isAdmin, currentUser, formData.technician, setFormData]);

  useEffect(() => {
    if (formData.phone.length >= 3) {
      const filtered = services.reduce((acc: ServiceTicket[], curr) => {
        const phone = String(curr.phone);
        if (phone.includes(formData.phone) && !acc.find(a => String(a.phone) === phone)) acc.push(curr);
        return acc;
      }, []);
      setPhoneSuggestions(filtered.slice(0, 5));
    } else setPhoneSuggestions([]);
  }, [formData.phone, services]);

  const updateField = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => {
      let nextState = { ...prev, [field]: value };
      
      if (field === 'status') {
        if (value === 'Hoàn thành') {
          nextState.debt = 0;
        } else {
          nextState.debt = Number(prev.revenue || 0);
        }
      } else if (field === 'revenue') {
        const rev = parseCurrency(value);
        nextState.revenue = rev;
        if (prev.status !== 'Hoàn thành') {
          nextState.debt = rev;
        } else {
          nextState.debt = 0;
        }
      } else if (field === 'cost') {
        nextState.cost = parseCurrency(value);
      }
      
      return nextState;
    });
  };

  const recalculateRevenue = (items: WorkItem[]) => {
    return items.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  };

  const addWorkItem = () => {
    setFormData(prev => ({
      ...prev,
      workItems: [...prev.workItems, { desc: '', qty: 1, price: '', total: 0 }]
    }));
  };

  const removeWorkItem = (index: number) => {
    setFormData(prev => {
      const newItems = prev.workItems.filter((_, i) => i !== index);
      const newRev = recalculateRevenue(newItems);
      return {
        ...prev,
        workItems: newItems,
        revenue: newRev,
        debt: prev.status === 'Hoàn thành' ? 0 : newRev
      };
    });
  };

  const updateWorkItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.workItems];
      const item = { ...newItems[index], [field]: value };
      
      const price = parseCurrency(field === 'price' ? value : item.price);
      const qty = Number(field === 'qty' ? value : item.qty);
      item.total = price * qty;
      
      newItems[index] = item;
      const totalRevenue = recalculateRevenue(newItems);
      
      return { 
        ...prev, 
        workItems: newItems, 
        revenue: totalRevenue,
        debt: prev.status === 'Hoàn thành' ? 0 : totalRevenue
      };
    });
  };

  const handleDownloadImage = async () => {
    if (!billRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `Bill_${formData.customerName.toUpperCase().replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
      link.click();
    } catch (err) {
      console.error("Lỗi lưu ảnh:", err);
      alert("Không thể lưu ảnh tự động. Vui lòng chụp màn hình bill này!");
    } finally {
      setIsCapturing(false);
    }
  };

  const inputStyle = "w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-400 transition-all font-medium text-slate-800";

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
          <Activity size={18} className="text-blue-500"/> {selectedId ? 'Cập nhật phiếu' : 'Tiếp nhận mới'}
        </h2>
        {selectedId && isAdmin && (
          <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="tel" placeholder="Số điện thoại" className={inputStyle} value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
          {phoneSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
              {phoneSuggestions.map((s, i) => (
                <div key={i} onClick={() => { setFormData(prev => ({ ...prev, customerName: s.customerName, phone: s.phone, address: s.address || prev.address, content: s.content || '' })); setPhoneSuggestions([]); }} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                  <div className="font-semibold text-slate-800">{s.customerName}</div>
                  <div className="text-[11px] text-slate-400">{s.phone} - {s.address}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Tên khách hàng" className={inputStyle} value={formData.customerName} onChange={e => updateField('customerName', e.target.value)} />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Địa chỉ" className={inputStyle} value={formData.address} onChange={e => updateField('address', e.target.value)} />
        </div>

        <div className="relative">
          <MessageSquare className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <textarea 
            placeholder="Nội dung yêu cầu từ khách hàng..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-blue-400 transition-all font-medium text-slate-800 min-h-[80px] text-[13px]"
            value={formData.content} 
            onChange={e => updateField('content', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-semibold appearance-none cursor-pointer focus:bg-white focus:border-blue-400" value={formData.status} onChange={e => updateField('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
          <div className={`relative ${!isAdmin ? 'opacity-70 pointer-events-none bg-slate-100 rounded-xl' : ''}`}>
            <select 
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-semibold appearance-none cursor-pointer focus:bg-white focus:border-blue-400" 
              value={formData.technician} 
              onChange={e => updateField('technician', e.target.value)}
              disabled={!isAdmin}
            >
              <option value="">KTV</option>
              {technicians.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px]">Dịch vụ & Linh kiện</span>
            <button onClick={addWorkItem} className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Plus size={18}/></button>
          </div>
          
          <div className="space-y-2">
            {formData.workItems.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl group transition-all hover:border-blue-100 relative">
                <div className="relative w-full">
                   <input 
                    type="text" placeholder="Nội dung công việc..." 
                    className="w-full bg-transparent font-semibold text-slate-800 outline-none border-b border-transparent focus:border-blue-200 pb-1" 
                    value={item.desc} onFocus={() => setActiveWorkIdx(idx)} 
                    onChange={e => updateWorkItem(idx, 'desc', e.target.value)} 
                    onBlur={() => setTimeout(() => setActiveWorkIdx(null), 200)}
                  />
                   {activeWorkIdx === idx && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-[60] max-h-40 overflow-auto">
                        {historyWorkSuggestions.filter(p => p.name.toLowerCase().includes(item.desc.toLowerCase())).map((p, pi) => (
                          <div key={pi} onMouseDown={() => { updateWorkItem(idx, 'desc', p.name); updateWorkItem(idx, 'price', p.price); setActiveWorkIdx(null); }} className="p-2.5 hover:bg-slate-50 font-medium cursor-pointer flex justify-between border-b border-slate-50 last:border-0 text-[13px]">
                            <span>{p.name}</span>
                            <span className="text-blue-500 font-bold">{formatCurrency(p.price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-100 flex-1">
                    <span className="font-bold text-slate-400 text-[10px]">SL:</span>
                    <input 
                      type="number" className="w-full bg-transparent font-bold text-center outline-none" 
                      value={item.qty} onChange={e => updateWorkItem(idx, 'qty', e.target.value)} 
                    />
                  </div>
                  <div className="flex-[2] flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-400 text-[10px]">Giá:</span>
                    <input 
                      type="text" className="w-full bg-transparent font-bold text-right text-blue-600 outline-none" 
                      value={formatCurrency(item.price)} onChange={e => updateWorkItem(idx, 'price', e.target.value)} 
                    />
                  </div>
                  <button onClick={() => removeWorkItem(idx)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">Tổng thu</span>
              <input 
                type="text" 
                className="bg-transparent text-right font-bold text-slate-800 outline-none w-1/2" 
                value={formatCurrency(formData.revenue)} 
                onChange={e => updateField('revenue', e.target.value)} 
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">Giá Vốn</span>
              <input 
                type="text" 
                className="bg-transparent text-right font-bold text-blue-500 outline-none w-1/2" 
                value={formatCurrency(formData.cost)} 
                onChange={e => updateField('cost', e.target.value)} 
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-500 uppercase tracking-widest text-[11px]">Còn nợ</span>
              <input 
                type="text" 
                className="bg-transparent text-right font-bold text-red-500 outline-none w-1/2" 
                value={formatCurrency(formData.debt)} 
                onChange={e => updateField('debt', e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          {!selectedId ? (
            <button disabled={isSubmitting} onClick={onSave} className="col-span-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-wider">
              {isSubmitting ? <Activity className="animate-spin" size={18}/> : <Save size={18}/>} LƯU PHIẾU
            </button>
          ) : (
            <>
              <button disabled={isSubmitting} onClick={onUpdate} className="bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-wider">
                {isSubmitting ? <Activity className="animate-spin" size={18}/> : <RefreshCw size={18}/>} CẬP NHẬT
              </button>
              <button onClick={onClear} className="bg-white border border-slate-200 text-slate-500 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-wider">
                <Plus size={18}/> TIẾP MỚI
              </button>
            </>
          )}
        </div>

        {selectedId && (
          <button 
            onClick={() => setShowBill(true)}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-wider shadow-md"
          >
            <ReceiptText size={18}/> XUẤT HÓA ĐƠN (BILL)
          </button>
        )}
      </div>

      {/* FIXED LAYER BILL: SIÊU HIỂN THỊ TRÊN CÙNG */}
      {showBill && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-2 max-w-[450px] w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl relative animate-in fade-in slide-in-from-bottom-6 duration-300">
            <button 
              onClick={() => setShowBill(false)} 
              className="absolute top-4 right-4 p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 hover:text-slate-900 z-[100001] shadow-sm transition-colors"
            >
              <X size={20}/>
            </button>
            
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              <div ref={billRef} id="bill-content-area" className="bg-white rounded-2xl">
                <InvoiceTemplate formData={formData} bankInfo={bankInfo} />
              </div>
            </div>

            <div className="p-4 pt-0 border-t border-slate-50 grid grid-cols-2 gap-3 mt-2">
              <button 
                onClick={handleDownloadImage} 
                disabled={isCapturing}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-[12px] active:scale-95 transition-all shadow-lg shadow-green-100 disabled:opacity-50"
              >
                {isCapturing ? <Activity size={18} className="animate-spin" /> : <Download size={18}/>} LƯU ẢNH BILL
              </button>
              <button 
                onClick={() => window.print()} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-[12px] active:scale-95 transition-all shadow-lg shadow-blue-100"
              >
                IN HÓA ĐƠN
              </button>
              <button 
                onClick={() => setShowBill(false)} 
                className="col-span-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl uppercase tracking-widest text-[12px] transition-all"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
