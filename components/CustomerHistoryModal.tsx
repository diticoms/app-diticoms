import React from 'react';
import { X, CheckCircle2, Activity, Clock, FileText } from 'lucide-react';
import { ServiceTicket } from '../types.ts';
import { formatCurrency } from '../utils/helpers.ts';

interface Props {
  phone: string;
  customerName: string;
  services: ServiceTicket[];
  onClose: () => void;
}

export const CustomerHistoryModal: React.FC<Props> = ({ phone, customerName, services, onClose }) => {
  const customerServices = services
    .filter(s => s.phone === phone)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Hoàn thành':
      case 'Đã tất toán':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'Đang xử lý':
        return <Activity size={16} className="text-blue-500" />;
      case 'Tiếp nhận':
        return <FileText size={16} className="text-slate-500" />;
      default:
        return <Clock size={16} className="text-orange-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[10003] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[32px] p-6 shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">Lịch sử Khách hàng</h3>
            <p className="text-[12px] text-brand-600 font-bold uppercase tracking-widest">{customerName || 'Khách hàng'} - {phone}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
          {customerServices.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium">Chưa có lịch sử dịch vụ.</div>
          ) : (
            customerServices.map((ticket, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 hover:border-brand-200 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status || '')}
                    <span className="font-bold text-slate-800">{ticket.ticketNumber || '#------'}</span>
                  </div>
                  <div className="text-[10px] font-black uppercase text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
                    {new Date(ticket.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-100 text-sm text-slate-600">
                  <div className="font-bold text-slate-700 mb-1">Yêu cầu / Lỗi:</div>
                  {ticket.content || 'Không có mô tả'}
                </div>

                {Array.isArray(ticket.workItems) && ticket.workItems.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Dịch vụ thực hiện:</div>
                    {ticket.workItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-[11px] font-bold text-slate-700 px-1">
                        <span>- {item.desc} (x{item.qty})</span>
                        <span className="text-brand-600">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                  <span className="text-slate-500">KTV: <span className="text-brand-600">{ticket.technician || '---'}</span></span>
                  <div className="flex gap-4">
                    <span className="text-emerald-600">Tổng: {formatCurrency(ticket.revenue)}</span>
                    {Number(ticket.debt) > 0 && (
                      <span className="text-red-500">Nợ: {formatCurrency(ticket.debt)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
