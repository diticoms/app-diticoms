
import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { Logo } from './Logo.tsx';

interface Props {
  onLogin: (u: string, p: string) => void;
  isLoading: boolean;
}

export const LoginScreen: React.FC<Props> = ({ onLogin, isLoading }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (u && p) onLogin(u, p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans text-sm">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-lg border border-slate-100 p-8 space-y-8 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/98 z-[100] flex flex-col items-center justify-center space-y-6">
             <div className="relative flex flex-col items-center">
                <Logo size={80} className="animate-pulse" />
                <div className="mt-8 text-center">
                  <p className="font-black text-blue-600 uppercase tracking-[0.3em] text-[10px]">ĐANG TẢI...</p>
                </div>
             </div>
          </div>
        )}

        <div className="flex flex-col items-center text-center space-y-3">
          <Logo size={64} className={isLoading ? "animate-pulse" : ""} />
          <div>
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">DITICOMS SERVICE</h1>
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mt-1">Hệ thống quản lý nội bộ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
            <input 
              type="text" 
              placeholder="Tên đăng nhập" 
              className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-400 font-medium"
              value={u} 
              onChange={e => setU(e.target.value)} 
              required
              autoComplete="username"
              spellCheck="false"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-400 font-medium"
              value={p} 
              onChange={e => setP(e.target.value)} 
              required
              autoComplete="current-password"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-md active:bg-blue-700 transition-colors uppercase tracking-widest mt-2"
          >
            ĐĂNG NHẬP
          </button>
        </form>
        
        <div className="pt-4 text-center border-t border-slate-50">
           <p className="font-bold text-slate-300 uppercase tracking-widest text-[9px]">v1.0.44 • diticoms.vn</p>
        </div>
      </div>
    </div>
  );
};
