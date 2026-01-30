
import React, { useState } from 'react';
import { User, Lock, Settings, Loader2 } from 'lucide-react';
import { Logo } from './Logo.tsx';

interface Props {
  onLogin: (u: string, p: string) => void;
  onOpenConfig: () => void;
  isLoading: boolean;
}

export const LoginScreen: React.FC<Props> = ({ onLogin, onOpenConfig, isLoading }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="flex flex-col items-center">
          <div className="h-24 w-24 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 mb-4">
            <Logo size={70} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Diticoms Service</h2>
          <p className="text-slate-500 text-sm font-semibold">Đăng nhập để quản lý dịch vụ</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(u, p); }}>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Tên đăng nhập" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={u} onChange={e => setU(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" placeholder="Mật khẩu" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={p} onChange={e => setP(e.target.value)}
            />
          </div>
          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="flex justify-center pt-4">
          <button onClick={onOpenConfig} className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors">
            <Settings size={14} /> Cấu hình Server
          </button>
        </div>
      </div>
    </div>
  );
};
