import React, { useState } from 'react';
import { User, Lock, Settings } from 'lucide-react';
import { Logo } from './Logo.tsx';

interface Props {
  onLogin: (u: string, p: string) => void;
  onOpenConfig: () => void;
  isLoading: boolean;
}

export const LoginScreen: React.FC<Props> = ({ onLogin, onOpenConfig, isLoading }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (u && p) onLogin(u, p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-6 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
              <Logo size={50} />
            </div>
            <p className="font-bold text-slate-800 text-sm animate-pulse uppercase tracking-widest">ĐANG ĐĂNG NHẬP...</p>
          </div>
        )}

        <div className="flex flex-col items-center text-center space-y-2">
          <Logo size={80} />
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">DITICOMS SERVICE</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Hệ thống quản lý dịch vụ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Tên đăng nhập" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
              value={u} onChange={e => setU(e.target.value)} required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" placeholder="Mật khẩu" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
              value={p} onChange={e => setP(e.target.value)} required
            />
          </div>
          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest active:scale-[0.98]"
          >
            ĐĂNG NHẬP
          </button>
        </form>

        <div className="pt-4 border-t border-slate-50 flex justify-center">
          <button onClick={onOpenConfig} className="text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2 uppercase tracking-widest transition-colors">
            <Settings size={14} /> Cấu hình Server
          </button>
        </div>
      </div>
    </div>
  );
};