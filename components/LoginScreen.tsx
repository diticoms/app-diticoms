
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
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl border border-slate-100 p-10 space-y-10 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center space-y-6">
             <div className="relative flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                  <Logo size={80} className="relative z-10 animate-pulse" />
                </div>
                <div className="mt-8 text-center">
                  <p className="font-black text-blue-600 uppercase tracking-[0.3em] text-[10px] animate-bounce">ĐANG TẢI DỮ LIỆU</p>
                  <div className="flex gap-1 justify-center mt-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                  </div>
                </div>
             </div>
          </div>
        )}

        <div className="flex flex-col items-center text-center space-y-4">
          <Logo size={72} />
          <div>
            <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">DITICOMS SERVICE</h1>
            <p className="font-bold text-slate-400 uppercase tracking-widest mt-2">Hệ thống quản lý nội bộ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors" size={22} />
            <input 
              type="text" placeholder="Tên đăng nhập" className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-300 transition-all font-medium"
              value={u} onChange={e => setU(e.target.value)} required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors" size={22} />
            <input 
              type="password" placeholder="Mật khẩu" className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-blue-300 transition-all font-medium"
              value={p} onChange={e => setP(e.target.value)} required
            />
          </div>
          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center uppercase tracking-widest active:scale-[0.98]"
          >
            ĐĂNG NHẬP HỆ THỐNG
          </button>
        </form>
        
        <div className="pt-6 text-center border-t border-slate-50">
           <p className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">v1.0.44 • diticoms.vn</p>
        </div>
      </div>
    </div>
  );
};
