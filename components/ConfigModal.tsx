import React, { useState } from 'react';
import { X, Save, Server, CreditCard } from 'lucide-react';
import { AppConfig } from '../types.ts';

interface Props {
  config: AppConfig;
  onSave: (c: AppConfig) => void;
  onClose: () => void;
  isAdmin: boolean;
}

export const ConfigModal: React.FC<Props> = ({ config, onSave, onClose, isAdmin }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>({ ...config });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-slate-900 uppercase tracking-tight">Cấu hình hệ thống</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2"><Server size={12}/> Server URL (Google Sheet)</label>
            <input 
              type="text" className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-xs"
              value={localConfig.sheetUrl} onChange={e => setLocalConfig(prev => ({ ...prev, sheetUrl: e.target.value }))}
            />
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2"><CreditCard size={12}/> Thông tin ngân hàng</label>
             <div className="grid grid-cols-2 gap-3">
                <input 
                  placeholder="ID Ngân hàng" className="p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-xs"
                  value={localConfig.bankInfo?.bankId} onChange={e => setLocalConfig(prev => ({ ...prev, bankInfo: { ...prev.bankInfo!, bankId: e.target.value } }))}
                />
                <input 
                  placeholder="Số tài khoản" className="p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-xs"
                  value={localConfig.bankInfo?.accountNo} onChange={e => setLocalConfig(prev => ({ ...prev, bankInfo: { ...prev.bankInfo!, accountNo: e.target.value } }))}
                />
                <input 
                  placeholder="Chủ tài khoản" className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-xs"
                  value={localConfig.bankInfo?.accountName} onChange={e => setLocalConfig(prev => ({ ...prev, bankInfo: { ...prev.bankInfo!, accountName: e.target.value.toUpperCase() } }))}
                />
             </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => onSave(localConfig)} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
            <Save size={18}/> LƯU CẤU HÌNH
          </button>
          <button onClick={onClose} className="px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl">HỦY</button>
        </div>
      </div>
    </div>
  );
};