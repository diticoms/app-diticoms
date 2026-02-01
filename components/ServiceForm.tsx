
import React from 'react';
import { 
  Plus, Trash2, Save, RefreshCw, Activity, Share2, Clipboard, 
  Wrench, Users, User, Phone, MapPin, ListFilter, AlertTriangle, Loader2 
} from 'lucide-react';
import { ServiceFormData, PriceItem, ServiceTicket } from '../types.ts';
import { STATUS_OPTIONS } from '../constants.ts';
import { formatCurrency, parseCurrency } from '../utils/helpers.ts';

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
  onShareImage: () => void;
  onCopyZalo: () => void;
  onOpenTechManager: () => void;
  services: ServiceTicket[];
}

export const ServiceForm: React.FC<Props> = ({
  formData, setFormData, technicians, priceList, selectedId, isSubmitting, 
  currentUser, onSave, onUpdate, onDelete, onClear, onShareImage, onCopyZalo, onOpenTechManager
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const updateField = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addWorkItem = () => {
    setFormData(prev => ({
      ...prev,
      workItems: [...prev.workItems, { desc: '', qty: 1, price: '', total: 0 }]
    }));
  };

  const updateWorkItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.workItems];
      const item = { ...newItems[index], [field]: value };
      
      // Tự động tính toán tổng tiền cho từng item
      const price = parseCurrency(field === 'price' ? value : item.price);
      const qty = Number(field === 'qty' ? value : item.qty);
      item.total = price * qty;
      
      newItems[index] = item;
      return { ...prev, workItems: newItems };
    });
  };

  const removeWorkItem = (index: number) => {
    if (formData.workItems.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      workItems: prev.workItems.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-slate-900 uppercase flex items-center gap-2 text-sm md:text-base">
          <Activity className="text-blue-600" size={20}/> {selectedId ? 'Chi tiết phiếu' : 'Tiếp nhận mới'}
        </h2>
        {selectedId && isAdmin && (
          <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={18}/>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="relative group">
            <User className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" placeholder="Họ tên khách hàng" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-semibold transition-all"
              value={formData.customerName} onChange={e => updateField('customerName', e.target.value)}
            />
          </div>
          <div className="relative group">
            <Phone className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" placeholder="Số điện thoại" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-semibold transition-all"
              value={formData.phone} onChange={e => updateField('phone', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Trạng thái</label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold appearance-none cursor-pointer"
              value={formData.status} onChange={e => updateField('status', e.target.value)}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between ml-2 mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Kỹ thuật</label>
              {isAdmin && <button onClick={onOpenTechManager} className="text-[9px] text-blue-600 font-bold hover:underline">QL</button>}
            </div>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold appearance-none cursor-pointer"
              value={formData.technician} onChange={e => updateField('technician', e.target.value)}
            >
              <option value="">Chọn KTV</option>
              {technicians.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between ml-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nội dung sửa chữa</label>
            <button onClick={addWorkItem} className="p-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Plus size={16}/></button>
          </div>
          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {formData.workItems.map((item, idx) => (
              <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm hover:border-blue-200 transition-all">
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="Công việc/Linh kiện" className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:font-normal"
                    value={item.desc} onChange={e => updateWorkItem(idx, 'desc', e.target.value)}
                  />
                  <button onClick={() => removeWorkItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                </div>
                <div className="flex gap-4 items-center pt-2 border-t border-slate-50">
                  <div className="flex-1 flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">SL:</span>
                     <input type="number" className="w-10 bg-transparent text-sm font-black outline-none" value={item.qty} onChange={e => updateWorkItem(idx, 'qty', e.target.value)} min="1" />
                  </div>
                  <div className="flex-[2] flex items-center gap-2 justify-end">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">GIÁ:</span>
                     <input 
                      type="text" className="w-full bg-transparent text-sm font-black text-blue-600 text-right outline-none" 
                      value={formatCurrency(item.price)} onChange={e => updateWorkItem(idx, 'price', e.target.value)} 
                     />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Thực thu (VNĐ)</label>
              <input 
                type="text" className="bg-transparent text-right font-black text-green-600 outline-none text-base"
                value={formatCurrency(formData.revenue)} onChange={e => updateField('revenue', e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nợ khách</label>
              <input 
                type="text" className="bg-transparent text-right font-black text-red-500 outline-none text-base"
                value={formatCurrency(formData.debt)} onChange={e => updateField('debt', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        {!selectedId ? (
          <button 
            disabled={isSubmitting} onClick={onSave}
            className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {/* Fix: Added Loader2 to imports */}
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20}/>}
            <span className="uppercase tracking-widest text-sm">Lưu phiếu mới</span>
          </button>
        ) : (
          <>
            <button 
              disabled={isSubmitting} onClick={onUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {/* Fix: Added Loader2 to imports */}
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18}/>} CẬP NHẬT
            </button>
            <button onClick={onClear} className="bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
              <Plus size={18}/> TIẾP MỚI
            </button>
          </>
        )}
        <button onClick={onShareImage} className="bg-orange-50 text-orange-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-orange-100 hover:bg-orange-100 transition-colors">
          <Share2 size={18}/> ẢNH BILL
        </button>
        {/* Fix: Changed handleCopyZalo to onCopyZalo */}
        <button onClick={onCopyZalo} className="bg-blue-50 text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-colors">
          <Clipboard size={18}/> COPY ZALO
        </button>
      </div>
    </div>
  );
};
