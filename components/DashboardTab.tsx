import React, { useMemo, useState } from 'react';
import { DollarSign, CheckCircle2, ClipboardList, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { ServiceTicket, User } from '../types.ts';
import { formatCurrency } from '../utils/helpers.ts';

interface Props {
  services: ServiceTicket[];
  currentUser: User;
}

export const DashboardTab: React.FC<Props> = ({ services, currentUser }) => {
  const isAdmin = currentUser.role === 'admin';
  const [statDateFrom, setStatDateFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statDateTo, setStatDateTo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Lọc dữ liệu theo quyền
  const viewableServices = useMemo(() => {
    if (isAdmin) return services;
    return services.filter(s => {
      const techList = (s.technician || '').split(', ').filter(Boolean);
      return techList.includes(currentUser.associatedTech || currentUser.name);
    });
  }, [services, isAdmin, currentUser]);

  const stats = useMemo(() => {
    let revenueAll = 0;
    let revenueFiltered = 0;
    let profitFiltered = 0;
    let debtAll = 0;
    let ticketsAllFiltered = 0;
    let ticketsCompletedFiltered = 0;

    viewableServices.forEach(s => {
      const isCompleted = s.status === 'Hoàn thành' || s.status === 'Đã tất toán';
      const createdDate = new Date(s.created_at || new Date());
      const monthStr = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      const isFilteredMonth = monthStr >= statDateFrom && monthStr <= statDateTo;

      if (isCompleted) {
        revenueAll += Number(s.revenue) || 0;
        if (isFilteredMonth) {
          revenueFiltered += Number(s.revenue) || 0;
          profitFiltered += (Number(s.revenue) || 0) - (Number(s.cost) || 0);
        }
      }
      
      debtAll += Number(s.debt) || 0;

      if (isFilteredMonth) {
        ticketsAllFiltered += 1;
        if (isCompleted) ticketsCompletedFiltered += 1;
      }
    });

    return { revenueAll, revenueFiltered, profitFiltered, debtAll, ticketsAllFiltered, ticketsCompletedFiltered };
  }, [viewableServices, statDateFrom, statDateTo]);

  const technicianStats = useMemo(() => {
    if (!isAdmin) return [];
    const statsMap: Record<string, { revenue: number, completed: number, total: number, debt: number, profit: number }> = {};
    
    viewableServices.forEach(s => {
      const createdDate = new Date(s.created_at || new Date());
      const monthStr = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthStr < statDateFrom || monthStr > statDateTo) return;

      const techList = (s.technician || 'Chưa gán').split(', ').filter(Boolean);
      if (techList.length === 0) techList.push('Chưa gán');

      const isCompleted = s.status === 'Hoàn thành' || s.status === 'Đã tất toán';
      const revenue = Number(s.revenue) || 0;
      const cost = Number(s.cost) || 0;
      const profit = revenue - cost;
      const debt = Number(s.debt) || 0;

      const splitRevenue = revenue / techList.length;
      const splitProfit = profit / techList.length;
      const splitDebt = debt / techList.length;

      techList.forEach(tech => {
        if (!statsMap[tech]) statsMap[tech] = { revenue: 0, completed: 0, total: 0, debt: 0, profit: 0 };
        
        statsMap[tech].total += 1;
        if (isCompleted) {
          statsMap[tech].revenue += splitRevenue;
          statsMap[tech].profit += splitProfit;
          statsMap[tech].completed += 1;
        }
        statsMap[tech].debt += splitDebt;
      });
    });

    return Object.entries(statsMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [viewableServices, isAdmin, statDateFrom, statDateTo]);

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-brand-500" size={28} />
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tổng Quan</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{isAdmin ? 'Toàn bộ hệ thống' : `KTV: ${currentUser.name}`}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 bg-white rounded-2xl px-3 md:px-4 py-2 border border-slate-200 shadow-sm w-full md:w-auto justify-center md:justify-start">
            <Calendar size={16} className="text-slate-400 hidden md:block" />
            <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Từ:</span>
            <input 
              type="month" 
              value={statDateFrom}
              onChange={(e) => setStatDateFrom(e.target.value)}
              className="bg-transparent text-slate-800 font-bold text-[11px] md:text-sm outline-none cursor-pointer w-[100px] md:w-[120px]"
            />
            <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest ml-1 md:ml-2">Đến:</span>
            <input 
              type="month" 
              value={statDateTo}
              onChange={(e) => setStatDateTo(e.target.value)}
              className="bg-transparent text-slate-800 font-bold text-[11px] md:text-sm outline-none cursor-pointer w-[100px] md:w-[120px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card: Doanh thu tháng này */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh thu (Tháng lọc)</span>
              <div className="p-2 bg-brand-100 text-brand-600 rounded-xl"><DollarSign size={20} /></div>
            </div>
            <div className="relative z-10 text-2xl font-black text-slate-800">
              {formatCurrency(stats.revenueFiltered)}
            </div>
          </div>

          {/* Card: Lợi nhuận tháng này */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lợi nhuận (Tháng lọc)</span>
              <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><TrendingUp size={20} /></div>
            </div>
            <div className="relative z-10 text-2xl font-black text-purple-600">
              {formatCurrency(stats.profitFiltered)}
            </div>
          </div>

          {/* Card: Tổng doanh thu */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng doanh thu</span>
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><DollarSign size={20} /></div>
            </div>
            <div className="relative z-10 text-2xl font-black text-slate-800">
              {formatCurrency(stats.revenueAll)}
            </div>
          </div>

          {/* Card: Công nợ */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng công nợ</span>
              <div className="p-2 bg-red-100 text-red-600 rounded-xl"><AlertCircle size={20} /></div>
            </div>
            <div className="relative z-10 text-2xl font-black text-red-500">
              {formatCurrency(stats.debtAll)}
            </div>
          </div>

          {/* Card: Số phiếu */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phiếu hoàn thành (Tháng lọc)</span>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><CheckCircle2 size={20} /></div>
            </div>
            <div className="relative z-10 flex items-baseline gap-2 text-2xl font-black text-slate-800">
              {stats.ticketsCompletedFiltered} <span className="text-sm text-slate-400 font-bold">/ {stats.ticketsAllFiltered}</span>
            </div>
          </div>
        </div>

        {isAdmin && technicianStats.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ClipboardList size={16} /> Hiệu suất Kỹ thuật viên
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-3 px-2">Kỹ thuật viên</th>
                    <th className="pb-3 px-2 text-right">Xong / Tổng</th>
                    <th className="pb-3 px-2 text-right">Doanh thu</th>
                    <th className="pb-3 px-2 text-right">Lợi nhuận</th>
                    <th className="pb-3 px-2 text-right">Công nợ</th>
                  </tr>
                </thead>
                <tbody>
                  {technicianStats.map((tech, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-2 font-bold text-slate-800">{tech.name}</td>
                      <td className="py-4 px-2 text-right font-black text-blue-600">
                        {tech.completed} <span className="text-[10px] text-slate-400 font-bold">/ {tech.total}</span>
                      </td>
                      <td className="py-4 px-2 text-right font-black text-emerald-600">{formatCurrency(tech.revenue)}</td>
                      <td className="py-4 px-2 text-right font-black text-purple-600">{formatCurrency(tech.profit)}</td>
                      <td className="py-4 px-2 text-right font-black text-red-500">{formatCurrency(tech.debt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
