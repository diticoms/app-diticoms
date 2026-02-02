
import React, { useState, useMemo, useRef } from 'react';
import { Search, Loader2, ChevronRight, Calendar, Filter, CheckCircle2, MessageSquare, Phone, MapPin, Download } from 'lucide-react';
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

  const debouncedSetSearch = useMemo(() => debounce((val: string) => setFilters.setSearchTerm(val), 300), [setFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const handleExportExcel = () => {
    if (data.length === 0) return alert("Không có dữ liệu để xuất!");
    
    const excelData = data.map(item => {
      const revenue = Number(item.revenue || 0);
      const cost = Number(item.cost || 0);
      const profit = revenue - cost;
      const debt = Number(item.debt || 0);
      
      return {
        "Ngày nhập": (item.created_at || '').split('T')[0],
        "Khách hàng": item.customerName,
        "Số điện thoại": item.phone,
        "Địa chỉ": item.address,
        "Kỹ thuật viên": item.technician || "Chưa phân công",
        "Nội dung dịch vụ": item.content,
        "Doanh thu (đ)": revenue,
        "Giá vốn (đ)": cost,
        "Lợi nhuận (đ)": profit,
        "Công nợ (đ)": debt,
        "Trạng thái": item.status
      };
    });

    if (isAdmin) {
      const totals = excelData.reduce((acc, curr) => ({
        revenue: acc.revenue + curr["Doanh thu (đ)"],
        cost: acc.cost + curr["Giá vốn (đ)"],
        profit: acc.profit + curr["Lợi nhuận (đ)"],
        debt: acc.debt + curr["Công nợ (đ)"]
      }), { revenue: 0, cost: 0, profit: 0, debt: 0 });

      excelData.push({
        "Ngày nhập": "TỔNG CỘNG",
        "Khách hàng": "",
        "Số điện thoại": "",
        "Địa chỉ": "",
        "Kỹ thuật viên": "",
        "Nội dung dịch vụ": "",
        "Doanh thu (đ)": totals.revenue,
        "Giá vốn (đ)": totals.cost,
        "Lợi nhuận (đ)": totals.profit,
        "Công nợ (đ)": totals.debt,
        "Trạng thái": ""
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoDichVu");
    const fileName = `Diticoms_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const copyToClipboard = (item: ServiceTicket) => {
    const text = `📌 THÔNG TIN KHÁCH HÀNG\n----------------------\n👤 Khách: ${item.customerName}\n📞 SĐT: ${item.phone}\n📍 Địa chỉ: ${item.address || 'Không có'}\n💬 Yêu cầu: ${item.content || 'Sửa chữa thiết bị'}\n----------------------\n🔧 Kỹ thuật: ${item.technician || 'Chưa phân công'}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus('Đã chép thông tin!');
      setTimeout(() => setCopyStatus(null), 2000);
    }).catch(err => {
      console.error('Lỗi copy:', err);
    });
  };

  const handlePointerDown = (e: React.PointerEvent, item: ServiceTicket) => {
    isLongPress.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      copyToClipboard(item);
    }, 600);
  };

  const handlePointerUp = (e: React.PointerEvent, item: ServiceTicket) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!isLongPress.current) onSelectRow(item);
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col font-sans text-sm relative overflow-hidden lg:h-full">
      {copyStatus && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-2xl animate-in fade-in zoom-in duration-200">
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

        <div className="flex flex-wrap items-center gap-1.5">
           <button 
            onClick={() => setFilters.setViewAll(!filters.viewAll)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 border shadow-sm text-[11px] ${filters.viewAll ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            <Filter size={14} /> {filters.viewAll ? 'Tất cả' : 'Lọc'}
          </button>
          
          {!filters.viewAll && (
            <div className="flex items-center gap-1 bg-white rounded-xl px-2 border border-slate-200 h-[34px] shadow-sm">
              <Calendar size={12} className="text-slate-400" />
              <input type="date" className="bg-transparent font-bold text-slate-600 outline-none w-[88px] text-[10px]" value={filters.dateFrom} onChange={e => setFilters.setDateFrom(e.target.value)} />
              <span className="text-slate-300">/</span>
              <input type="date" className="bg-transparent font-bold text-slate-600 outline-none w-[88px] text-[10px]" value={filters.dateTo} onChange={e => setFilters.setDateTo(e.target.value)} />
            </div>
          )}

          {isAdmin && (
            <>
              <div className="relative flex-1 min-w-[80px]">
                <select className="w-full pl-2 pr-6 py-1.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-600 appearance-none h-[34px] cursor-pointer text-[10px] shadow-sm" value={filters.searchTech} onChange={e => setFilters.setSearchTech(e.target.value)}>
                  <option value="">KTV</option>
                  {technicians.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button 
                onClick={handleExportExcel}
                className="h-[34px] px-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 text-[10px] uppercase tracking-wider"
              >
                <Download size={14} /> EXCEL
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 lg:overflow-y-auto space-y-2 pr-1 custom-scrollbar pb-2">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-50 scale-150"></div>
              <Logo size={48} className="relative z-10 animate-pulse" />
            </div>
            <span className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Đang tải...</span>
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
              onPointerDown={(e) => handlePointerDown(e, item)}
              onPointerUp={(e) => handlePointerUp(e, item)}
              className={`p-4 rounded-[24px] border transition-all cursor-pointer flex items-center justify-between group relative select-none touch-none ${selectedId === item.id ? 'bg-blue-50/80 border-blue-100 ring-2 ring-blue-50' : 'bg-white border-slate-50 hover:border-slate-200 hover:bg-slate-50/50'}`}
            >
              <div className="flex gap-3.5 items-center flex-1 min-w-0">
                <div className="h-11 w-11 bg-slate-100/50 rounded-2xl flex flex-col items-center justify-center font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors text-[13px] shrink-0 shadow-sm">
                  <span>{(item.created_at || '').split('T')[0]?.split('-')[2] || '--'}</span>
                  <span className="opacity-60 text-[10px]">T{(item.created_at || '').split('T')[0]?.split('-')[1] || '--'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 leading-tight mb-0.5 truncate text-[14px]">{item.customerName}</div>
                  
                  <div className="flex flex-col gap-0.5 mb-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <Phone size={10} className="text-blue-400" />
                      <span>{item.phone}</span>
                      {item.address && (
                        <>
                          <span className="text-slate-200">|</span>
                          <MapPin size={10} className="text-red-400" />
                          <span className="truncate max-w-[120px]">{item.address}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 italic flex items-center gap-1">
                      <MessageSquare size={10} className="shrink-0" />
                      <span className="truncate">{item.content || 'Yêu cầu sửa chữa'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-400 uppercase tracking-tighter text-[10px] truncate max-w-[90px]">{item.technician || 'CHƯA PHÂN CÔNG'}</span>
                    <span className={`font-black px-2 py-0.5 rounded-lg uppercase tracking-widest text-[9px] ${item.status === 'Hoàn thành' ? 'bg-green-100 text-green-600' : item.status === 'Đang sửa chữa' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{item.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <div className="text-right">
                  <div className="font-black text-slate-800 text-[14px]">{formatCurrency(item.revenue)}đ</div>
                  {Number(item.debt) > 0 && <div className="font-black text-red-500 text-[10px] mt-0.5">Nợ: {formatCurrency(item.debt)}</div>}
                </div>
                <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-400 transition-all" />
              </div>
              {selectedId === item.id && <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full" />}
            </div>
          ))
        )}
      </div>

      <div className="mt-2 pt-4 border-t border-slate-50 flex flex-wrap justify-between items-center gap-2 px-1 shrink-0">
        <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
          {filters.viewAll ? 'Tổng cộng: ' : 'Trong ngày: '} 
          <span className="text-slate-700 ml-1 font-black">{data.length}</span>
        </span>
        {isAdmin && (
          <span className="font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl uppercase tracking-[0.1em] border border-blue-100 text-[11px] shadow-sm">
            Thu: {formatCurrency(data.reduce((s, i) => s + Number(i.revenue || 0), 0))}đ
          </span>
        )}
      </div>
    </div>
  );
};
