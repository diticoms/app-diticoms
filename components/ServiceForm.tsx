import React from 'react';
import { 
  Plus, Trash2, Save, RefreshCw, Activity, Share2, Clipboard, 
  Wrench, Users, User, Phone, MapPin, ListFilter, AlertTriangle 
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
    const newItems = [...formData.workItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'price' || field === 'qty') {
      const price = typeof newItems[index].price === 'string' ? parseCurrency(newItems[index].price) : newItems[index].price;
      const qty = Number(newItems[index].qty);
      newItems[index].total = price * qty;
    }
    
    setFormData(prev => ({ ...prev, workItems: newItems }));
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
        <h2 className="font-black text-slate-900 uppercase flex items-center gap-2">
          <Activity className="text-blue-600" size={20}/> {selectedId ? 'Chi tiết phiếu' : 'Tiếp nhận mới'}
        </h2>
        {selectedId && isAdmin && (
          <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={18}/>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Họ tên khách hàng" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              value={formData.customerName} onChange={e => updateField('customerName', e.target.value)}
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Số điện thoại" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              value={formData.phone} onChange={e => updateField('phone', e.target.value)}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Địa chỉ" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              value={formData.address} onChange={e => updateField('address', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Trạng thái</label>
            <select 
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              value={formData.status} onChange={e => updateField('status', e.target.value)}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Kỹ thuật</label>
              {isAdmin && <button onClick={onOpenTechManager} className="text-[10px] text-blue-600 font-bold hover:underline">SỬA</button>}
            </div>
            <select 
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              value={formData.technician} onChange={e => updateField('technician', e.target.value)}
            >
              <option value="">Chọn KTV</option>
              {technicians.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nội dung sửa chữa</label>
            <button onClick={addWorkItem} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Plus size={14}/></button>
          </div>
          {formData.workItems.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" placeholder="Công việc/Linh kiện" className="flex-1 bg-transparent text-sm font-semibold outline-none"
                  value={item.desc} onChange={e => updateWorkItem(idx, 'desc', e.target.value)}
                />
                <button onClick={() => removeWorkItem(idx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex-1 flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-400">SL:</span>
                   <input type="number" className="w-12 bg-transparent text-sm outline-none" value={item.qty} onChange={e => updateWorkItem(idx, 'qty', e.target.value)} />
                </div>
                <div className="flex-1 flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-400">GIÁ:</span>
                   <input 
                    type="text" className="w-full bg-transparent text-sm font-bold text-blue-600 outline-none" 
                    value={formatCurrency(item.price)} onChange={e => updateWorkItem(idx, 'price', e.target.value)} 
                   />
                </div>
              </div>
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Thực thu</label>
              <input 
                type="text" className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-green-600 outline-none"
                value={formatCurrency(formData.revenue)} onChange={e => updateField('revenue', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nợ khách</label>
              <input 
                type="text" className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-red-600 outline-none"
                value={formatCurrency(formData.debt)} onChange={e => updateField('debt', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4">
        {!selectedId ? (
          <button 
            disabled={isSubmitting} onClick={onSave}
            className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save size={18}/> LƯU PHIẾU
          </button>
        ) : (
          <>
            <button 
              disabled={isSubmitting} onClick={onUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18}/> CẬP NHẬT
            </button>
            <button onClick={onClear} className="bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
              <Plus size={18}/> TIẾP MỚI
            </button>
          </>
        )}
        <button onClick={onShareImage} className="bg-orange-50 text-orange-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 border border-orange-100">
          <Share2 size={18}/> ẢNH BILL
        </button>
        <button onClick={onCopyZalo} className="bg-blue-50 text-blue-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 border border-blue-100">
          <Clipboard size={18}/> COPY ZALO
        </button>
      </div>
    </div>
  );
};