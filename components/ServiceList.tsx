
import React, { useState, useMemo, useRef } from 'react';
import { Search, Loader2, ChevronRight, Calendar, Filter, CheckCircle2, MessageSquare, Phone, MapPin, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ServiceTicket } from '../types.ts';
import { formatCurrency, debounce } from '../utils/helpers.ts';
import { Logo } from './Logo.tsx';

interface Props {
  data: ServiceTicket[];
  loading: boolean;
  technicians: string[];
  selectedId: string | null;
  onSelectRow: (item: ServiceTicket) => void;
  filters: any;
  setFilters: any;
  currentUser: any;
}

export const ServiceList: React.FC<Props> = ({
  data, loading, technicians, selectedId, onSelectRow, filters, setFilters, currentUser
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [localSearch, setLocalSearch] = useState(filters.searchTerm);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const debouncedSetSearch = useMemo(() => debounce((val: string) => setFilters.setSearchTerm(val), 300), [setFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const handleExportExcel = () => {
    if (data.length === 0) return alert("Không có dữ liệu!");
    const excelData = data.map(item => ({
      "Ngày nhập": (item.created_at || '').split('T')[0],
      "Khách hàng": item.customerName,
      "Số điện thoại": item.phone,
      "Địa chỉ": item.address,
      "Kỹ thuật viên": item.technician || "Chưa phân công",
      "Nội dung": item.content,
      "Doanh thu (đ)": Number(item.revenue || 0),
      "Giá vốn (đ)": Number(item.cost || 0),
      "Lợi nhuận (đ)": Number(item.revenue || 0) - Number(item.cost || 0),
      "Công nợ (đ)": Number(item.debt || 0),
      "Trạng thái": item.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCao");
    XLSX.writeFile(workbook, `Diticoms_Report_${new Date().getTime()}.xlsx`);
  };

  const copyToClipboard = (item: ServiceTicket) => {
    const text = `👤 Khách: ${item.customerName}\n📞 SĐT: ${item.phone}\n📍 Địa chỉ: ${item.address}\n💬 Yêu cầu: ${item.content}\n🔧 Kỹ thuật: ${item.technician}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus('Đã chép thông tin!');
      setTimeout(() => setCopyStatus(null), 2000);
    });
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col font-sans text-sm relative overflow-hidden lg:h-full">
      {copyStatus && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-2xl animate-in fade-in">
          <CheckCircle2 size={16} className="text-green-400" />
          <span className="font-black text-[11px] uppercase tracking-widest">{copyStatus}</span>
        </div>
      )}

      <div className="space-y-3 mb-5 shrink-0">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" placeholder="Tìm tên, SĐT hoặc địa chỉ..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-50 rounded-xl outline-none focus:bg-white focus:border-blue-100 transition-all font-medium"
            value={localSearch} onChange={handleSearchChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <button 
            onClick={() => setFilters.setViewAll(!filters.viewAll)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 border shadow-sm text-[11px] ${filters.viewAll ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            <Filter size={14} /> {filters.viewAll ? 'Tất cả' : 'Lọc Ngày'}
          </button>
          
          {!filters.viewAll && (
            <div className="flex items-center gap-1 bg-white rounded-xl px-2 border border-slate-200 h-[34px] shadow-sm">
              <Calendar size={12} className="text-slate-400" />
              <input type="date" className="bg-transparent font-bold text-slate-600 outline-none w-[88px] text-[10px]" value={filters.dateFrom} onChange={e => setFilters.setDateFrom(e.target.value)} />
              <span className="text-slate-300">/</span>
              <input type="date" className="bg-transparent font-bold text-slate-600 outline-none w-[88px] text-[10px]" value={filters.dateTo} onChange={e => setFilters.setDateTo(e.target.value)} />
            </div>
          )}

          <div className="flex items-center gap-1 bg-white rounded-xl px-2 border border-slate-200 h-[34px] shadow-sm">
            <Users size={12} className="text-slate-400" />
            <select 
              className="bg-transparent font-bold text-slate-600 outline-none text-[10px] border-none focus:ring-0 pr-6"
              value={isAdmin ? filters.searchTech : (currentUser?.associatedTech || '')}
              onChange={e => isAdmin && setFilters.setSearchTech(e.target.value)}
              disabled={!isAdmin}
            >
              <option value="">Tất cả KTV</option>
              {technicians.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <button onClick={handleExportExcel} className="h-[34px] px-3 ml-auto bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-[10px] uppercase shadow-sm">
            <Download size={14} /> EXCEL
          </button>
        </div>
      </div>

      <div className="flex-1 lg:overflow-y-auto space-y-2 pr-1 custom-scrollbar pb-2">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Logo size={48} className="animate-pulse" />
            <span className="font-black text-slate-400 tracking-[0.2em] text-[10px]">ĐANG TẢI...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-300 space-y-3">
            <Search size={48} strokeWidth={1} className="opacity-40" />
            <span className="font-black uppercase tracking-widest text-[11px]">Không có dữ liệu</span>
          </div>
        ) : (
          data.map(item => (
            <div 
              key={item.id} 
              onPointerDown={(e) => {
                isLongPress.current = false;
                hasMoved.current = false;
                startPos.current = { x: e.clientX, y: e.clientY };
                longPressTimer.current = setTimeout(() => { if (!hasMoved.current) { isLongPress.current = true; copyToClipboard(item); } }, 600);
              }}
              onPointerMove={(e) => { if (Math.abs(e.clientX - startPos.current.x) > 10) hasMoved.current = true; }}
              onPointerUp={() => { clearTimeout(longPressTimer.current); if (!isLongPress.current && !hasMoved.current) onSelectRow(item); }}
              className={`p-4 rounded-[24px] border transition-all cursor-pointer flex items-center justify-between group relative select-none touch-pan-y ${selectedId === item.id ? 'bg-blue-50/80 border-blue-100 ring-2 ring-blue-50' : 'bg-white border-slate-50 hover:border-slate-200'}`}
            >
              <div className="flex gap-3.5 items-center flex-1 min-w-0">
                <div className="h-11 w-11 bg-slate-100/50 rounded-2xl flex flex-col items-center justify-center font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors text-[13px] shrink-0">
                  <span>{(item.created_at || '').split('T')[0]?.split('-')[2] || '--'}</span>
                  <span className="opacity-60 text-[10px]">T{(item.created_at || '').split('T')[0]?.split('-')[1] || '--'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 leading-tight mb-0.5 truncate text-[14px]">{item.customerName}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mb-1.5">
                    <Phone size={10} className="text-blue-400" /> {item.phone}
                    <span className="text-slate-200">|</span>
                    <MapPin size={10} className="text-red-400" /> <span className="truncate">{item.address || 'Không địa chỉ'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-400 uppercase tracking-tighter text-[10px] truncate max-w-[90px]">{item.technician || 'CHƯA PHÂN CÔNG'}</span>
                    <span className={`font-black px-2 py-0.5 rounded-lg uppercase tracking-widest text-[9px] ${item.status === 'Hoàn thành' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{item.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <div className="text-right">
                  <div className="font-black text-slate-800 text-[14px]">{formatCurrency(item.revenue)}đ</div>
                  {Number(item.debt) > 0 && <div className="font-black text-red-500 text-[10px]">Nợ: {formatCurrency(item.debt)}</div>}
                </div>
                <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-400" />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 pt-4 border-t border-slate-50 flex justify-between items-center px-1 shrink-0">
        <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Số lượng: <span className="text-slate-700">{data.length}</span></span>
        <span className="font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl uppercase tracking-[0.1em] border border-blue-100 text-[11px] shadow-sm">
          Tổng thu: {formatCurrency(data.reduce((s, i) => s + Number(i.revenue || 0), 0))}đ
        </span>
      </div>
    </div>
  );
};
