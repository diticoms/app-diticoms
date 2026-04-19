
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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100 via-slate-50 to-white p-6 font-sans text-sm">
      <div className="max-w-md w-full glass-effect rounded-[32px] shadow-card border border-white/60 p-8 space-y-8 relative overflow-hidden card-hover">
        {/* Abstract shapes for background decoration */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-brand-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-6">
             <div className="relative flex flex-col items-center">
                <Logo size={80} className="animate-pulse" />
                <div className="mt-8 text-center">
                  <p className="font-black text-brand-600 uppercase tracking-[0.3em] text-[10px] animate-pulse">ĐANG TẢI...</p>
                </div>
             </div>
          </div>
        )}

        <div className="flex flex-col items-center text-center space-y-3 relative z-10">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-brand-50 mb-2">
            <Logo size={64} className={isLoading ? "animate-pulse" : ""} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight gradient-text">DITICOMS SERVICE</h1>
            <p className="font-bold text-slate-400 uppercase tracking-[0.2em] text-[9px] mt-2">Hệ thống quản lý nội bộ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 smooth-transition z-10" size={20} />
            <input 
              type="text" 
              placeholder="Tên đăng nhập" 
              className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 font-medium text-slate-700 placeholder-slate-400 smooth-transition shadow-sm"
              value={u} 
              onChange={e => setU(e.target.value)} 
              required
              autoComplete="username"
              spellCheck="false"
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 smooth-transition z-10" size={20} />
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 font-medium text-slate-700 placeholder-slate-400 smooth-transition shadow-sm"
              value={p} 
              onChange={e => setP(e.target.value)} 
              required
              autoComplete="current-password"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5 active:translate-y-0 smooth-transition uppercase tracking-widest mt-4 text-[13px]"
          >
            ĐĂNG NHẬP
          </button>
        </form>
        
        <div className="pt-6 text-center border-t border-slate-100 relative z-10">
           <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">v1.0.46 • diticoms.vn</p>
        </div>
      </div>
    </div>
  );
};
