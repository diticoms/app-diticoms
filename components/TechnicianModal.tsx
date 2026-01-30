
import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Users, Loader2 } from 'lucide-react';
import { callSheetAPI } from '../services/api';

interface Props {
  technicians: string[];
  setTechnicians: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  sheetUrl: string;
}

export const TechnicianModal: React.FC<Props> = ({ technicians, setTechnicians, onClose, sheetUrl }) => {
  const [newTech, setNewTech] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localList, setLocalList] = useState([...technicians]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await callSheetAPI(sheetUrl, 'save_settings', { technicians: localList });
      if (response.status === 'success') {
        setTechnicians(localList);
        localStorage.setItem('diti_techs', JSON.stringify(localList));
        alert("Đã lưu danh sách KTV!");
        onClose();
      }
    } catch (e) { alert("Lỗi khi lưu!"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><Users size={18} /> Quản lý KTV</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" placeholder="Tên KTV mới" className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
            value={newTech} onChange={e => setNewTech(e.target.value)}
            onKeyDown={e => { if(e.key === 'Enter' && newTech) { setLocalList([...localList, newTech.trim()]); setNewTech(''); } }}
          />
          <button 
            onClick={() => { if(newTech) { setLocalList([...localList, newTech.trim()]); setNewTech(''); } }}
            className="p-2.5 bg-blue-600 text-white rounded-xl"
          >
            <Plus size={20}/>
          </button>
        </div>

        <div className="max-h-60 overflow-auto space-y-2 custom-scrollbar pr-1">
          {localList.map((t, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="font-bold text-sm text-slate-700">{t}</span>
              <button onClick={() => setLocalList(localList.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button 
            disabled={isLoading} onClick={handleSave}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Save size={18}/>} LƯU LẠI
          </button>
          <button onClick={onClose} className="px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl">HỦY</button>
        </div>
      </div>
    </div>
  );
};
