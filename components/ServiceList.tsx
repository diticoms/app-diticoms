import React from 'react';
import { Search, Calendar, Filter, Loader2, ChevronRight } from 'lucide-react';
import { ServiceTicket } from '../types.ts';
import { formatCurrency } from '../utils/helpers.ts';

interface Props {
  data: ServiceTicket[];
  loading: boolean;
  technicians: string[];
  selectedId: string | null;
  onSelectRow: (item: ServiceTicket) => void;
  filters: {
    dateFrom: string;
    dateTo: string;
    searchTerm: string;
    searchTech: string;
  };
  setFilters: {
    setDateFrom: (v: string) => void;
    setDateTo: (v: string) => void;
    setSearchTerm: (v: string) => void;
    setSearchTech: (v: string) => void;
  };
  currentUser: any;
}

export const ServiceList: React.FC<Props> = ({
  data, loading, technicians, selectedId, onSelectRow, filters, setFilters, currentUser
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
      <div className="flex flex-col gap-4 mb-6">
        {/* Ô tìm kiếm */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" placeholder="Tìm tên, SĐT, KTV, Mã phiếu..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
            value={filters.searchTerm} onChange={e => setFilters.setSearchTerm(e.target.value)}
          />
        </div>

        {/* Bộ lọc ngày tháng và KTV - Sửa lỗi tràn khung */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Từ ngày</span>
            <input 
              type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold"
              value={filters.dateFrom} onChange={e => setFilters.setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Đến ngày</span>
            <input 
              type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold"
              value={filters.dateTo} onChange={e => setFilters.setDateTo(e.target.value)}
            />
          </div>
          {isAdmin && (
            <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Kỹ thuật viên</span>
              <select 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold"
                value={filters.searchTech} onChange={e => setFilters.setSearchTech(e.target.value)}
              >
                <option value="">Tất cả KTV</option>
                {technicians.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-sm text-center px-4">Không tìm thấy dữ liệu phù hợp</div>
        ) : (
          <div className="space-y-3">
            {data.map(item => (
              <div 
                key={item.id} onClick={() => onSelectRow(item)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${selectedId === item.id ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
              >
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className={`h-11 w-11 md:h-12 md:w-12 rounded-xl flex flex-col items-center justify-center text-[9px] md:text-[10px] font-black shrink-0 ${selectedId === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <span>{item.created_at.split('T')[0].split('-')[2]}</span>
                    <span>THG {item.created_at.split('T')[0].split('-')[1]}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate text-sm md:text-base">{item.customerName}</div>
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                        item.status === 'Hoàn thành' ? 'bg-green-100 text-green-600' : 
                        item.status === 'Đã trả khách' ? 'bg-slate-100 text-slate-600' : 
                        'bg-orange-100 text-orange-600'
                      }`}>{item.status}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase truncate">KTV: {item.technician || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2 md:gap-4 shrink-0">
                  <div className="hidden sm:block">
                    <div className="text-sm font-black text-slate-900">{formatCurrency(item.revenue)}đ</div>
                    {Number(item.debt) > 0 && <div className="text-[9px] font-bold text-red-500 uppercase">Nợ: {formatCurrency(item.debt)}đ</div>}
                  </div>
                  <div className="sm:hidden text-xs font-black text-slate-900">
                    {formatCurrency(item.revenue)}đ
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Tổng số: {data.length} phiếu</span>
        {isAdmin && <span className="text-blue-600">Tổng thu: {formatCurrency(data.reduce((s, i) => s + Number(i.revenue || 0), 0))}đ</span>}
      </div>
    </div>
  );
};