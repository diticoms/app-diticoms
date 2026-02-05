
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
import { DEFAULT_CONFIG, STATUS_OPTIONS, SHEET_API_URL } from './constants.ts';
import { getTodayString } from './utils/helpers.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('diti_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('diti_config');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    return { ...parsed, sheetUrl: SHEET_API_URL };
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
    customerName: '', phone: '', address: '', status: STATUS_OPTIONS[0],
    technician: '', content: '',
    workItems: [{ desc: '', qty: 1, price: '', total: 0 }],
    revenue: 0, cost: 0, debt: 0
  });

  // Logic xóa màn hình Splash khi App khởi tạo xong
  useEffect(() => {
    const removeSplash = () => {
      const splash = document.getElementById('splash');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
          if (splash && splash.parentNode) {
            splash.remove();
          }
        }, 600);
      }
    };
    
    // Đợi 800ms sau khi component mount để trải nghiệm mượt mà hơn
    const timer = setTimeout(removeSplash, 800);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const resData = await callSheetAPI(config.sheetUrl, 'read');
      if (Array.isArray(resData)) {
        const mapped = resData.map((r: any) => {
          let parsedWorkItems = [];
          try {
            parsedWorkItems = typeof r.work_items === 'string' ? JSON.parse(r.work_items) : (r.work_items || []);
          } catch (e) {
            parsedWorkItems = [];
          }
          return {
            ...r,
            customerName: r.customer_name || r.customerName || '',
            workItems: Array.isArray(parsedWorkItems) ? parsedWorkItems : [],
            revenue: Number(r.revenue || 0),
            cost: Number(r.cost || 0),
            debt: Number(r.debt || 0),
            created_at: r.created_at || r.date || new Date().toISOString()
          };
        });
        setServices(mapped);
      }

      const resConfig = await callSheetAPI(config.sheetUrl, 'read_settings');
      if (resConfig) {
        let techList = [];
        if (resConfig.technicians) {
          try {
            techList = typeof resConfig.technicians === 'string' ? JSON.parse(resConfig.technicians) : resConfig.technicians;
          } catch (e) {
            techList = ["KTV Mặc định"];
          }
        }
        setTechnicians(Array.isArray(techList) ? techList : []);
      }

      const resPrice = await callSheetAPI(config.sheetUrl, 'read_pricelist');
      if (Array.isArray(resPrice)) setPriceList(resPrice);
      
    } catch (e) { 
      console.error("Fetch Data Error:", e);
    } finally { 
      setLoading(false); 
    }
  }, [user, config.sheetUrl]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  const filteredServices = useMemo(() => {
    let result = [...services];
    if (user?.role !== 'admin' && user?.associatedTech) {
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
        (s.phone || '').includes(term) || 
        (s.address || '').toLowerCase().includes(term)
      );
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [services, filters, user]);

  const handleLogin = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const res = await callSheetAPI(config.sheetUrl, 'login', { username, password: pass });
      if (res && res.status === 'success' && res.user) {
        setUser(res.user);
        localStorage.setItem('diti_user', JSON.stringify(res.user));
      } else {
        alert(res?.error || 'Sai thông tin đăng nhập');
      }
    } catch (e) { 
      alert('Không thể kết nối máy chủ');
    } finally { 
      setLoading(false); 
    }
  };

  const handleLogout = () => {
    if (confirm('Đăng xuất khỏi hệ thống?')) {
      setUser(null);
      localStorage.removeItem('diti_user');
    }
  };

  const handleSelectRow = (item: ServiceTicket) => {
    setSelectedId(item.id);
    setFormData({
      customerName: item.customerName, 
      phone: item.phone, 
      address: item.address,
      status: item.status, 
      technician: item.technician, 
      content: item.content,
      workItems: Array.isArray(item.workItems) ? item.workItems : [],
      revenue: item.revenue, 
      cost: item.cost, 
      debt: item.debt
    });
    if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prepareDataForScript = (data: ServiceFormData) => ({
    ...data,
    customer_name: data.customerName,
    work_items: data.workItems,
    search_key: `${data.customerName} ${data.phone} ${data.address}`.toLowerCase()
  });

  if (!user) return <LoginScreen onLogin={handleLogin} isLoading={loading} />;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <div>
              <h1 className="font-bold text-slate-800 text-[12px] uppercase">DITICOMS SERVICE</h1>
              <span className="text-slate-400 text-[10px] uppercase font-bold">{user.name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowConfig(true)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Settings size={18} /></button>
            <button onClick={handleLogout} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden">
        <div className="max-w-7xl mx-auto p-4 lg:p-6 h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-full bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <ServiceForm 
                formData={formData} setFormData={setFormData} technicians={technicians}
                priceList={priceList} selectedId={selectedId} isSubmitting={isSubmitting}
                currentUser={user} services={services} bankInfo={config.bankInfo}
                onClear={() => { 
                  setSelectedId(null); 
                  setFormData({ 
                    customerName: '', phone: '', address: '', status: STATUS_OPTIONS[0], 
                    technician: user.associatedTech || '', content: '', 
                    workItems: [{ desc: '', qty: 1, price: '', total: 0 }], 
                    revenue: 0, cost: 0, debt: 0 
                  }); 
                }}
                onSave={async () => {
                  setIsSubmitting(true);
                  try {
                    const payload = prepareDataForScript(formData);
                    const res = await callSheetAPI(config.sheetUrl, 'create', { 
                      ...payload, 
                      id: Date.now().toString(), 
                      created_at: new Date().toISOString() 
                    });
                    if(res && res.status === 'success') { 
                      fetchData(); 
                      alert("Đã lưu phiếu thành công"); 
                      setSelectedId(null);
                    }
                  } catch(e) {
                    alert("Lỗi khi lưu: " + (e instanceof Error ? e.message : "Không rõ lỗi"));
                  } finally { setIsSubmitting(false); }
                }}
                onUpdate={async () => {
                  if(!selectedId) return;
                  setIsSubmitting(true);
                  try {
                    const payload = prepareDataForScript(formData);
                    const res = await callSheetAPI(config.sheetUrl, 'update', { 
                      ...payload, 
                      id: selectedId,
                      created_at: services.find(s => s.id === selectedId)?.created_at 
                    });
                    if(res && (res.status === 'updated' || res.status === 'success')) { 
                      fetchData(); 
                      alert("Đã cập nhật thành công"); 
                    }
                  } catch(e) {
                    alert("Lỗi khi cập nhật");
                  } finally { setIsSubmitting(false); }
                }}
                onDelete={async () => {
                   if(!selectedId || !confirm('Bạn chắc chắn muốn xóa phiếu này?')) return;
                   setIsSubmitting(true);
                   try {
                     const res = await callSheetAPI(config.sheetUrl, 'delete', { id: selectedId, role: user.role });
                     if(res && (res.status === 'deleted' || res.status === 'success')) { 
                       fetchData(); 
                       setSelectedId(null); 
                       alert("Đã xóa phiếu");
                     } else {
                       alert(res?.error || "Không thể xóa");
                     }
                   } finally { setIsSubmitting(false); }
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-7 h-full flex flex-col min-h-[500px]">
            <ServiceList 
              data={filteredServices} loading={loading} technicians={technicians}
              selectedId={selectedId} onSelectRow={handleSelectRow}
              filters={filters} setFilters={{
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

      {showConfig && (
        <ConfigModal 
          config={config} 
          isAdmin={user.role === 'admin'} 
          onClose={() => setShowConfig(false)} 
          onSave={(c) => { 
            setConfig(c); 
            localStorage.setItem('diti_config', JSON.stringify(c)); 
            setShowConfig(false); 
          }} 
        />
      )}
      
      {showTechModal && (
        <TechnicianModal 
          technicians={technicians} 
          setTechnicians={setTechnicians} 
          onClose={() => setShowTechModal(false)} 
          sheetUrl={config.sheetUrl} 
        />
      )}
    </div>
  );
};

export default App;
