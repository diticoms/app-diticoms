
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
  
  const [services, setServices] = useState<ServiceTicket[]>(() => {
    const cached = localStorage.getItem('diti_services_cache');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [priceList, setPriceList] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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

  useEffect(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 600);
      }, 500);
    }

    // Lắng nghe sự kiện cài đặt PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => window.removeEventListener('beforeinstallprompt', () => {});
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Để cài đặt: \n- Android: Chọn 'Thêm vào màn hình chính' trong menu trình duyệt.\n- iOS: Nhấn nút Share rồi chọn 'Thêm vào MH chính'.");
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(services.length === 0);
    try {
      const [resData, resConfig, resPrice] = await Promise.all([
        callSheetAPI(config.sheetUrl, 'read'),
        callSheetAPI(config.sheetUrl, 'read_settings'),
        callSheetAPI(config.sheetUrl, 'read_pricelist')
      ]);

      if (Array.isArray(resData)) {
        const mapped = resData.map((r: any) => ({
          ...r,
          customerName: r.customer_name || r.customerName || '',
          workItems: typeof r.work_items === 'string' ? JSON.parse(r.work_items) : (r.work_items || []),
          revenue: Number(r.revenue || 0),
          cost: Number(r.cost || 0),
          debt: Number(r.debt || 0),
          created_at: r.created_at || r.date || new Date().toISOString()
        }));
        setServices(mapped);
        localStorage.setItem('diti_services_cache', JSON.stringify(mapped));
      }

      if (resConfig?.technicians) {
        const techList = typeof resConfig.technicians === 'string' ? JSON.parse(resConfig.technicians) : resConfig.technicians;
        setTechnicians(Array.isArray(techList) ? techList : []);
      }

      if (Array.isArray(resPrice)) setPriceList(resPrice);
    } catch (e) { 
      console.error("Fetch Error:", e);
    } finally { 
      setLoading(false); 
    }
  }, [user, config.sheetUrl, services.length]);

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
      if (res?.status === 'success' && res.user) {
        setUser(res.user);
        localStorage.setItem('diti_user', JSON.stringify(res.user));
      } else {
        alert(res?.error || 'Sai thông tin');
      }
    } catch (e) { alert('Lỗi kết nối'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    if (confirm('Đăng xuất?')) {
      setUser(null);
      localStorage.clear();
      window.location.reload();
    }
  };

  const resetForm = useCallback(() => {
    setSelectedId(null);
    setFormData({ 
      customerName: '', phone: '', address: '', status: STATUS_OPTIONS[0], 
      technician: user?.associatedTech || '', content: '', 
      workItems: [{ desc: '', qty: 1, price: '', total: 0 }], 
      revenue: 0, cost: 0, debt: 0 
    });
  }, [user]);

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
            <button onClick={() => setShowConfig(true)} className="p-2 text-slate-400 hover:text-blue-500"><Settings size={18} /></button>
            <button onClick={handleLogout} className="p-2 text-red-400"><LogOut size={18} /></button>
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
                onClear={resetForm}
                onSave={async () => {
                  setIsSubmitting(true);
                  try {
                    const res = await callSheetAPI(config.sheetUrl, 'create', { 
                      ...formData, customer_name: formData.customerName, work_items: formData.workItems,
                      id: Date.now().toString(), created_at: new Date().toISOString() 
                    });
                    if(res?.status === 'success') { 
                      await fetchData(); 
                      resetForm();
                      alert("Lưu phiếu thành công"); 
                    }
                  } catch (e) {
                    alert("Lỗi khi lưu phiếu");
                  } finally { setIsSubmitting(false); }
                }}
                onUpdate={async () => {
                  if(!selectedId) return;
                  setIsSubmitting(true);
                  try {
                    await callSheetAPI(config.sheetUrl, 'update', { 
                      ...formData, customer_name: formData.customerName, work_items: formData.workItems, id: selectedId,
                      created_at: services.find(s => s.id === selectedId)?.created_at 
                    });
                    await fetchData(); 
                    resetForm();
                    alert("Cập nhật phiếu thành công");
                  } catch (e) {
                    alert("Lỗi khi cập nhật phiếu");
                  } finally { setIsSubmitting(false); }
                }}
                onDelete={async () => {
                   if(!selectedId || !confirm('Xóa?')) return;
                   setIsSubmitting(true);
                   try {
                     await callSheetAPI(config.sheetUrl, 'delete', { id: selectedId, role: user.role });
                     await fetchData(); 
                     resetForm();
                   } catch (e) {
                     alert("Lỗi khi xóa phiếu");
                   } finally { setIsSubmitting(false); }
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-7 h-full flex flex-col min-h-[500px]">
            <ServiceList 
              data={filteredServices} loading={loading} technicians={technicians}
              selectedId={selectedId} onSelectRow={(item) => {
                setSelectedId(item.id);
                setFormData({ ...item });
                if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              filters={filters} setFilters={{
                setDateFrom: (v: string) => setFilters(f => ({ ...f, dateFrom: v, viewAll: false })),
                setDateTo: (v: string) => setFilters(f => ({ ...f, dateTo: v, viewAll: false })),
                setSearchTerm: (v: string) => setFilters(f => ({ ...f, searchTerm: v })),
                setSearchTech: (v: string) => setFilters(f => ({ ...f, searchTech: v })),
                setViewAll: (v: boolean) => setFilters(f => ({ ...f, viewAll: v }))
              }}
              currentUser={user}
              onInstallApp={handleInstallApp}
              installAvailable={!!deferredPrompt}
            />
          </div>
        </div>
      </main>

      {showConfig && <ConfigModal config={config} isAdmin={user.role === 'admin'} onClose={() => setShowConfig(false)} onSave={(c) => { setConfig(c); localStorage.setItem('diti_config', JSON.stringify(c)); setShowConfig(false); }} />}
    </div>
  );
};

export default App;
