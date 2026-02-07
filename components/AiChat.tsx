
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Sparkles, Loader2, Bot } from 'lucide-react';
import { queryServiceData } from '../services/ai.ts';

interface Props {
  services: any[];
  onApplyFilter: (filters: any) => void;
}

export const AiChat: React.FC<Props> = ({ services, onApplyFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Chào bạn! Tôi có thể giúp bạn tìm kiếm khách hàng, lọc trạng thái hoặc thống kê doanh thu nhanh chóng. Bạn cần gì?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    try {
      const result = await queryServiceData(userText, services);
      setMessages(prev => [...prev, { role: 'bot', text: result.answer }]);
      
      if (result.filterUpdate) {
        onApplyFilter(result.filterUpdate);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'bot', text: "Lỗi kết nối AI: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[340px] h-[480px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col mb-4 animate-in slide-in-from-bottom overflow-hidden">
          <div className="bg-blue-600 p-5 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest">DITI AI Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold text-blue-100 uppercase">Sẵn sàng hỗ trợ</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-[12px] font-medium shadow-sm leading-relaxed ${
                  m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-bl-none flex items-center gap-3">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Đang phân tích...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-50 flex gap-2">
            <input 
              type="text" 
              placeholder="Nhập yêu cầu (VD: Thống kê doanh thu)" 
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-100 active:scale-90 transition-all disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 group relative ${
          isOpen ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isOpen ? <X size={24} /> : (
          <>
            <Bot size={28} />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">1</div>
          </>
        )}
      </button>
    </div>
  );
};
