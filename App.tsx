
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { ServiceList } from './components/ServiceList.tsx';
import { ServiceForm } from './components/ServiceForm.tsx';
import { ConfigModal } from './components/ConfigModal.tsx';
import { TechnicianModal } from './components/TechnicianModal.tsx';
import { Logo } from './components/Logo.tsx';
import { callSheetAPI } from './services/api.ts';
import { User, AppConfig, ServiceTicket, ServiceFormData, PriceItem } from './types.ts';
import { DEFAULT_CONFIG, STATUS_OPTIONS } from './constants.ts';
import { getTodayString } from './utils/helpers.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('diti_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('diti_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  
  const [services, setServices] = useState<ServiceTicket[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [priceList, setPriceList] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    dateFrom: getTodayString(),
    dateTo: getTodayString(),
    searchTerm: '',
    searchTech: '',
    viewAll: false
  });

  const [formData, setFormData] = useState<ServiceFormData>({
    customerName: '',
    phone: '',
    address: '',
    status: STATUS_OPTIONS[0],
    technician: '',
    content: '',
    workItems: [{ desc: '', qty: 1, price: '', total: 0 }],
    revenue: 0,
    cost: 0,
    debt: 0
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const resData = await callSheetAPI(config.sheetUrl, 'read');
      if (Array.isArray(resData)) {
        const mapped = resData.map((r: any) => {
          let items = [];
          try {
            items = typeof r.work_items === 'string' ? JSON.parse(r.work_items) : (r.work_items || []);
          } catch (e) { items = []; }
          
          return {
            ...r,
            customerName: r.customer_name || r.customerName || '',
            phone: r.phone || '',
            address: r.address || '',
            workItems: Array.isArray(items) ? items : [],
            revenue: Number(r.revenue || 0),
            cost: Number(r.cost || 0),
            debt: Number(r.debt || 0),
            searchKey: r.search_key || ''
          };
        });
        setServices(mapped);
      }
      
      const resConfig = await callSheetAPI(config.sheetUrl, 'read_settings');
      if (resConfig && resConfig.technicians) setTechnicians(resConfig.technicians);
      
      const resPrice = await callSheetAPI(config.sheetUrl, 'read_pricelist');
      if (Array.isArray(resPrice)) setPriceList(resPrice);
    } catch (e) { 
      console.error('Fetch Error:', e);
    }
    finally { setLoading(false); }
  }, [user, config.sheetUrl]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  const filteredServices = useMemo(() => {
    let result = [...services];
    if (!filters.viewAll) {
      result = result.filter(s => {
        const date = (s.created_at || '').split('T')[0];
        return date >= filters.dateFrom && date <= filters.dateTo;
      });
    }
    if (filters.searchTech) result = result.filter(s => s.technician === filters.searchTech);
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.customerName || '').toLowerCase().includes(term) || 
        (s.phone || '').includes(term) ||
        (s.address || '').toLowerCase().includes(term)
      );
    }
    return result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [services, filters]);

  const handleLogin = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const response = await callSheetAPI(config.sheetUrl, 'login', { username: username.trim(), password: pass.trim() });
      if (response.status === 'success' && response.user) {
        setUser(response.user);
        localStorage.setItem('diti_user', JSON.stringify(response.user));
      } else alert(response.error || 'Sai tài khoản hoặc mật khẩu.');
    } catch (e: any) { alert('Lỗi kết nối Server.'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    if (window.confirm('Xác nhận đăng xuất?')) {
      setUser(null);
      localStorage.removeItem('diti_user');
      setServices([]);
      setSelectedId(null);
    }
  };

  const handleClear = () => {
    setSelectedId(null);
    setFormData({
      customerName: '', phone: '', address: '', status: STATUS_OPTIONS[0],
      technician: user?.associatedTech || '', content: '',
      workItems: [{ desc: '', qty: 1, price: '', total: 0 }],
      revenue: 0, cost: 0, debt: 0
    });
  };

  const handleSave = async () => {
    if (!formData.customerName || !formData.phone) return alert('Thiếu thông tin khách hàng');
    setIsSubmitting(true);
    try {
      const res = await callSheetAPI(config.sheetUrl, 'create', { ...formData, id: Date.now().toString(), created_at: new Date().toISOString() });
      if(res.status === 'success') { fetchData(); handleClear(); }
    } catch(e: any) { alert("Lỗi khi lưu phiếu!"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if(!selectedId) return;
    setIsSubmitting(true);
    try {
      const res = await callSheetAPI(config.sheetUrl, 'update', { ...formData, id: selectedId });
      if(res.status === 'updated' || res.status === 'success') {
        fetchData();
        alert("Cập nhật thành công!");
      }
    } catch(e: any) { alert("Lỗi khi cập nhật!"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if(!selectedId || !window.confirm('Xóa phiếu này?')) return;
    setIsSubmitting(true);
    try {
      const res = await callSheetAPI(config.sheetUrl, 'delete', { id: selectedId, role: user?.role });
      if(res.status === 'deleted' || res.status === 'success') { 
        fetchData(); 
        handleClear(); 
      } else {
        alert(res.error || "Không thể xóa dữ liệu từ máy chủ.");
      }
    } catch(e: any) { alert("Lỗi kết nối khi xóa!"); }
    finally { setIsSubmitting(false); }
  };

  const handleSelectRow = (item: ServiceTicket) => {
    setSelectedId(item.id);
    let workItems = [];
    if (Array.isArray(item.workItems)) {
      workItems = item.workItems;
    } else if (typeof item.workItems === 'string') {
      try { workItems = JSON.parse(item.workItems); } catch (e) { workItems = []; }
    }
    
    setFormData({
      customerName: item.customerName || '',
      phone: item.phone || '',
      address: item.address || '',
      status: item.status || STATUS_OPTIONS[0],
      technician: item.technician || '',
      content: item.content || '',
      workItems: workItems.length > 0 ? workItems : [{ desc: '', qty: 1, price: '', total: 0 }],
      revenue: item.revenue || 0,
      cost: item.cost || 0,
      debt: item.debt || 0
    });
  };

  if (!user) return <LoginScreen onLogin={handleLogin} isLoading={loading} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-sm">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 px-4 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <div className="flex flex-col">
              <h1 className="font-bold text-slate-800 uppercase tracking-tight leading-none text-[12px]">DITICOMS SERVICE</h1>
              <span className="text-slate-400 font-medium uppercase tracking-wider mt-1 text-[10px]">{user.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowConfig(true)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><Settings size={18} /></button>
            <button onClick={handleLogout} className="p-2 text-red-400 hover:bg-red-50 rounded-xl"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <ServiceForm 
                formData={formData} setFormData={setFormData} technicians={technicians}
                priceList={priceList} selectedId={selectedId} isSubmitting={isSubmitting}
                currentUser={user} onClear={handleClear} 
                onSave={handleSave} onUpdate={handleUpdate} onDelete={handleDelete}
                services={services}
                bankInfo={config.bankInfo}
              />
            </div>
          </div>
          <div className="lg:col-span-7">
            <ServiceList 
              data={filteredServices} loading={loading} technicians={technicians}
              selectedId={selectedId} onSelectRow={handleSelectRow}
              filters={filters}
              setFilters={{
                setDateFrom: (v: string) => setFilters(f => ({ ...f, dateFrom: v, viewAll: false })),
                setDateTo: (v: string) => setFilters(f => ({ ...f, dateTo: v, viewAll: false })),
                setSearchTerm: (v: string) => setFilters(f => ({ ...f, searchTerm: v })),
                setSearchTech: (v: string) => setFilters(f => ({ ...f, searchTech: v })),
                setViewAll: (v: boolean) => setFilters(f => ({ ...f, viewAll: v }))
              }}
              currentUser={user}
            />
          </div>
        </div>
      </main>

      {showConfig && <ConfigModal config={config} onClose={() => setShowConfig(false)} isAdmin={user.role === 'admin'} onSave={(c) => { setConfig(c); localStorage.setItem('diti_config', JSON.stringify(c)); setShowConfig(false); }} />}
      {showTechModal && <TechnicianModal technicians={technicians} setTechnicians={setTechnicians} onClose={() => setShowTechModal(false)} sheetUrl={config.sheetUrl} />}
    </div>
  );
};

export default App;
