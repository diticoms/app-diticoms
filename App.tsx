
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { ServiceList } from './components/ServiceList.tsx';
import { ServiceForm } from './components/ServiceForm.tsx';
import { ConfigModal } from './components/ConfigModal.tsx';
import { Logo } from './components/Logo.tsx';
import { AiChat } from './components/AiChat.tsx';
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
        const mapped = resData.map((r: any) => {
          // PHÂN TÍCH DỮ LIỆU TỪ SHEET CỰC KỲ CẨN THẬN
          let parsedItems = [];
          const rawItems = r.work_items || r.workItems;
          
          if (Array.isArray(rawItems)) {
            parsedItems = rawItems;
          } else if (typeof rawItems === 'string' && rawItems.trim().startsWith('[')) {
            try { 
              parsedItems = JSON.parse(rawItems); 
            } catch (e) { 
              console.error("Lỗi parse JSON workItems:", e);
              parsedItems = []; 
            }
          }

          return {
            id: String(r.id),
            created_at: r.created_at || r.date || new Date().toISOString(),
            customerName: r.customer_name || r.customerName || '',
            phone: String(r.phone || '').replace(/^'/, ''), // Xóa dấu ' nếu có khi hiển thị
            address: r.address || '',
            status: r.status || STATUS_OPTIONS[0],
            technician: r.technician || '',
            content: r.content || '',
            workItems: parsedItems,
            revenue: Number(r.revenue || 0),
            cost: Number(r.cost || 0),
            debt: Number(r.debt || 0)
          };
        });
        setServices(mapped);
        localStorage.setItem('diti_services_cache', JSON.stringify(mapped));
      }

      if (resConfig?.technicians) {
        const techList = typeof resConfig.technicians === 'string' ? JSON.parse(resConfig.technicians) : resConfig.technicians;
        setTechnicians(Array.isArray(techList) ? techList : []);
      }
      if (Array.isArray(resPrice)) setPriceList(resPrice);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [user, config.sheetUrl, services.length]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  const filteredServices = useMemo(() => {
    let result = [...services];
    if (user?.role !== 'admin' && user?.associatedTech) {
      result = result.filter(s => s.technician === user.associatedTech);
    } else if (filters.searchTech) {
      result = result.filter(s => s.technician === filters.searchTech);
    }

    if (!filters.viewAll) {
      result = result.filter(s => {
        const date = (s.created_at || '').split('T')[0];
        return date >= filters.dateFrom && date <= filters.dateTo;
      });
    }

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

  const resetForm = useCallback((u = user) => {
    setSelectedId(null);
    setFormData({ 
      customerName: '', phone: '', address: '', status: STATUS_OPTIONS[0], 
      technician: u?.associatedTech || '', content: '', 
      workItems: [{ desc: '', qty: 1, price: '', total: 0 }], 
      revenue: 0, cost: 0, debt: 0 
    });
  }, [user]);

  const handleAction = async (action: 'create' | 'update') => {
    setIsSubmitting(true);
    try {
      // ĐẢM BẢO DỮ LIỆU GỬI ĐI LÀ MẢNG SẠCH ĐỂ SCRIPT JSON.stringify KHÔNG BỊ DOUBLE ESCAPE
      const payload = { 
        id: action === 'create' ? Date.now().toString() : selectedId,
        created_at: action === 'create' ? new Date().toISOString() : services.find(s => s.id === selectedId)?.created_at,
        customer_name: formData.customerName,
        phone: formData.phone, // Script của bạn sẽ tự thêm dấu '
        address: formData.address,
        status: formData.status,
        technician: formData.technician,
        content: formData.content,
        work_items: Array.isArray(formData.workItems) ? formData.workItems : [],
        revenue: Number(formData.revenue),
        cost: Number(formData.cost),
        debt: Number(formData.debt),
        search_key: `${formData.customerName} ${formData.phone}`.toLowerCase()
      };

      const res = await callSheetAPI(config.sheetUrl, action, payload);
      if(res?.status === 'success' || res?.status === 'updated') { 
        await fetchData(); 
        resetForm(); 
      } else {
        alert(res?.error || "Lỗi thao tác Server");
      }
    } catch (e) { 
      alert("Lỗi kết nối Server"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (!user) return <LoginScreen onLogin={async (u, p) => {
    setLoading(true);
    try {
      const res = await callSheetAPI(config.sheetUrl, 'login', { username: u, password: p });
      if (res?.status === 'success' && res.user) {
        setUser(res.user);
        localStorage.setItem('diti_user', JSON.stringify(res.user));
        resetForm(res.user);
      } else { alert(res?.error || 'Sai thông tin'); }
    } catch (e) { alert('Lỗi kết nối'); } finally { setLoading(false); }
  }} isLoading={loading} />;

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
            <button onClick={() => { if(confirm('Đăng xuất?')) { setUser(null); localStorage.clear(); window.location.reload(); } }} className="p-2 text-red-400"><LogOut size={18} /></button>
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
                onClear={() => resetForm()}
                onSave={() => handleAction('create')}
                onUpdate={() => handleAction('update')}
                onDelete={async () => {
                   if(!selectedId || !confirm('Xóa phiếu này?')) return;
                   setIsSubmitting(true);
                   try {
                     await callSheetAPI(config.sheetUrl, 'delete', { id: selectedId, role: user?.role });
                     await fetchData(); resetForm();
                   } catch (e) { alert("Lỗi xóa"); } finally { setIsSubmitting(false); }
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-7 h-full flex flex-col min-h-[500px]">
            <ServiceList 
              data={filteredServices} loading={loading} technicians={technicians}
              selectedId={selectedId} onSelectRow={(item) => {
                setSelectedId(item.id);
                setFormData({
                  customerName: item.customerName || '',
                  phone: item.phone || '',
                  address: item.address || '',
                  status: item.status || STATUS_OPTIONS[0],
                  technician: item.technician || '',
                  content: item.content || '',
                  workItems: Array.isArray(item.workItems) ? [...item.workItems] : [],
                  revenue: Number(item.revenue || 0),
                  cost: Number(item.cost || 0),
                  debt: Number(item.debt || 0)
                });
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
            />
          </div>
        </div>
      </main>

      <AiChat services={services} onApplyFilter={(aiFilters) => setFilters(prev => ({ ...prev, ...aiFilters }))} />

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
    </div>
  );
};

export default App;
