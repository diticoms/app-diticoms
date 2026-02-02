
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
            content: r.content || '',
            status: r.status || STATUS_OPTIONS[0],
            technician: r.technician || '',
            workItems: Array.isArray(items) ? items : [],
            revenue: Number(r.revenue || 0),
            cost: Number(r.cost || 0),
            debt: Number(r.debt || 0),
            created_at: r.created_at || r.date || new Date().toISOString()
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
    if (user && user.role !== 'admin' && user.associatedTech) {
      result = result.filter(s => s.technician === user.associatedTech);
    }
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
        (String(s.phone || '')).includes(term) ||
        (s.address || '').toLowerCase().includes(term)
      );
    }
    return result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [services, filters, user]);

  const prepareApiPayload = (data: ServiceFormData, id?: string, originalCreatedAt?: string) => {
    // Ép kiểu chuẩn cho workItems: [{"desc":"xxx","qty":yyy,"price":"zzz","total":zzz}]
    const workItems = data.workItems.map(item => ({
      desc: item.desc.trim(),
      qty: Number(item.qty) || 0,
      price: String(item.price).replace(/\D/g, ''),
      total: Number(item.total) || 0
    }));

    return {
      id: id || Date.now().toString(),
      customer_name: data.customerName,
      phone: data.phone,
      address: data.address,
      status: data.status,
      technician: data.technician,
      content: data.content,
      work_items: workItems, // Apps Script sẽ JSON.stringify cái này
      revenue: Number(data.revenue || 0),
      cost: Number(data.cost || 0),
      debt: Number(data.debt || 0),
      created_at: originalCreatedAt || (id ? undefined : new Date().toISOString())
    };
  };

  const handleLogin = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const response = await callSheetAPI(config.sheetUrl, 'login', { username: username.trim(), password: pass.trim() });
      if (response.status === 'success' && response.user) {
        setUser(response.user);
        localStorage.setItem('diti_user', JSON.stringify(response.user));
        if (response.user.role !== 'admin') {
          setFormData(prev => ({ ...prev, technician: response.user.associatedTech || '' }));
        }
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
      const payload = prepareApiPayload(formData);
      const res = await callSheetAPI(config.sheetUrl, 'create', payload);
      if(res.status === 'success') { 
        fetchData(); 
        handleClear(); 
        alert("Đã lưu phiếu thành công!");
      }
    } catch(e: any) { alert("Lỗi khi lưu phiếu!"); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if(!selectedId) return;
    setIsSubmitting(true);
    try {
      const originalItem = services.find(s => s.id === selectedId);
      const payload = prepareApiPayload(formData, selectedId, originalItem?.created_at);
      
      const res = await callSheetAPI(config.sheetUrl, 'update', payload);
      if(res.status === 'updated' || res.status === 'success') {
        fetchData();
        alert("Cập nhật thành công!");
      } else {
        alert(res.error || "Lỗi phản hồi từ máy chủ.");
      }
    } catch(e: any) { alert("Lỗi khi cập nhật!"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if(!selectedId || !window.confirm('Xác nhận XÓA phiếu này vĩnh viễn?')) return;
    setIsSubmitting(true);
    try {
      const res = await callSheetAPI(config.sheetUrl, 'delete', { id: selectedId, role: user?.role });
      if(res.status === 'deleted' || res.status === 'success') { 
        fetchData(); 
        handleClear(); 
        alert("Đã xóa phiếu.");
      } else {
        alert(res.error || "Không có quyền xóa hoặc lỗi Server.");
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
      revenue: Number(item.revenue || 0),
      cost: Number(item.cost || 0),
      debt: Number(item.debt || 0)
    });
  };

  if (!user) return <LoginScreen onLogin={handleLogin} isLoading={loading} />;

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-sm overflow-hidden">
      <header className="bg-white border-b border-slate-100 px-4 py-3 shrink-0 z-40">
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

      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 p-4 lg:p-6 flex flex-col">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full w-full">
            {/* CỘT TRÁI: FORM CỐ ĐỊNH */}
            <div className="lg:col-span-5 h-full flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
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

            {/* CỘT PHẢI: LIST CỐ ĐỊNH */}
            <div className="lg:col-span-7 h-full flex flex-col overflow-hidden">
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
        </div>
      </main>

      {showConfig && <ConfigModal config={config} onClose={() => setShowConfig(false)} isAdmin={user.role === 'admin'} onSave={(c) => { setConfig(c); localStorage.setItem('diti_config', JSON.stringify(c)); setShowConfig(false); }} />}
      {showTechModal && <TechnicianModal technicians={technicians} setTechnicians={setTechnicians} onClose={() => setShowTechModal(false)} sheetUrl={config.sheetUrl} />}
    </div>
  );
};

export default App;
