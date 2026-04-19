
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { ServiceList } from './components/ServiceList.tsx';
import { ServiceForm } from './components/ServiceForm.tsx';
import { ConfigModal } from './components/ConfigModal.tsx';
import { Logo } from './components/Logo.tsx';
import { AiChat } from './components/AiChat.tsx';
import { QuotationTool } from './components/QuotationTool.tsx';
import { callSheetAPI } from './services/api.ts';
import { User, AppConfig, ServiceTicket, ServiceFormData, PriceItem } from './types.ts';
import { DEFAULT_CONFIG, STATUS_OPTIONS, SHEET_API_URL } from './constants.ts';
import { getTodayString } from './utils/helpers.ts';
import { FileText, ClipboardList, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'quotation'>('services');
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('diti_user');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Lỗi đọc user từ localStorage", e);
      return null;
    }
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem('diti_config');
      const parsed = saved && saved !== 'undefined' ? JSON.parse(saved) : DEFAULT_CONFIG;
      return { ...parsed, sheetUrl: SHEET_API_URL };
    } catch (e) {
      console.error("Lỗi đọc config từ localStorage", e);
      return { ...DEFAULT_CONFIG, sheetUrl: SHEET_API_URL };
    }
  });
  
  const [services, setServices] = useState<ServiceTicket[]>(() => {
    try {
      const saved = localStorage.getItem('diti_services_cache');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Lỗi đọc services từ localStorage", e);
      return [];
    }
  });
  
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [priceList, setPriceList] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleUpdateTechnicians = async (newList: string[]) => {
    try {
      const res = await callSheetAPI(config.sheetUrl, 'save_settings', { technicians: JSON.stringify(newList) });
      if (res?.status === 'success') {
        setTechnicians(newList);
        return true;
      } else {
        alert(res?.error || "Lỗi cập nhật kỹ thuật viên");
        return false;
      }
    } catch (e) {
      alert("Lỗi kết nối khi cập nhật kỹ thuật viên");
      return false;
    }
  };

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
    revenue: 0, cost: 0, costPayer: 'Công ty', debt: 0
  });

  const [quotationInitialData, setQuotationInitialData] = useState<any>(null);

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
          let parsedItems = [];
          const rawItems = r.work_items || r.workItems;
          
          if (Array.isArray(rawItems)) {
            parsedItems = rawItems;
          } else if (typeof rawItems === 'string' && rawItems.trim().startsWith('[')) {
            try { 
              parsedItems = JSON.parse(rawItems); 
            } catch (e) { 
              parsedItems = []; 
            }
          }

          return {
            id: String(r.id),
            created_at: r.created_at || r.date || new Date().toISOString(),
            customerName: r.customer_name || r.customerName || '',
            phone: String(r.phone || '').replace(/^'/, ''),
            address: r.address || '',
            status: r.status || STATUS_OPTIONS[0],
            technician: r.technician || '',
            content: r.content || '',
            workItems: parsedItems,
            revenue: Number(r.revenue || 0),
            cost: Number(r.cost || 0),
            costPayer: r.cost_payer || r.costPayer || 'Công ty',
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
    } catch (e) { console.error("Lỗi tải dữ liệu:", e); } finally { setLoading(false); }
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
      revenue: 0, cost: 0, costPayer: 'Công ty', debt: 0 
    });
  }, [user]);

  const handleAction = async (action: 'create' | 'update') => {
    setIsSubmitting(true);
    try {
      const originalService = action === 'update' ? services.find(s => s.id === selectedId) : null;
      
      const payload = { 
        id: action === 'create' ? Date.now().toString() : selectedId,
        // GIỮ NGUYÊN NGÀY NHẬP GỐC KHI CẬP NHẬT
        created_at: action === 'create' ? new Date().toISOString() : (originalService?.created_at || new Date().toISOString()),
        customer_name: formData.customerName,
        phone: formData.phone, 
        address: formData.address,
        status: formData.status,
        technician: formData.technician,
        content: formData.content,
        // CHUẨN HÓA DỮ LIỆU MẢNG ĐỂ TRÁNH DOUBLE ESCAPING TRÊN SHEET
        work_items: Array.isArray(formData.workItems) ? formData.workItems : [],
        revenue: Number(formData.revenue),
        cost: Number(formData.cost),
        cost_payer: formData.costPayer || 'Công ty',
        debt: Number(formData.debt),
        search_key: `${formData.customerName} ${formData.phone} ${formData.address}`.toLowerCase()
      };

      const res = await callSheetAPI(config.sheetUrl, action, payload);
      if(res?.status === 'success' || res?.status === 'updated') { 
        await fetchData(); 
        resetForm(); 
        showToast(action === 'create' ? 'Đã lưu phiếu thành công!' : 'Đã cập nhật thành công!');
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
    <div className="flex flex-col min-h-screen bg-slate-50/50 font-sans selection:bg-brand-500/30">
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10005] bg-emerald-600 text-white px-6 py-3 rounded-full text-[12px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-5 shadow-2xl flex items-center gap-2">
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}
      <header className="sticky top-0 z-40 glass-effect border-b border-white/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <div>
                <h1 className="font-black text-slate-800 text-[14px] uppercase tracking-tight">DITICOMS <span className="gradient-text">SERVICE</span></h1>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">{user.name}</span>
              </div>
            </div>

            {/* Tab Switcher */}
            <nav className="hidden md:flex bg-slate-100/80 p-1 rounded-xl gap-1 border border-slate-200/50">
              <button 
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[11px] uppercase tracking-widest smooth-transition ${activeTab === 'services' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-brand-600 hover:bg-white/50'}`}
              >
                <ClipboardList size={16} />
                QUẢN LÝ PHIẾU
              </button>
              <button 
                onClick={() => setActiveTab('quotation')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[11px] uppercase tracking-widest smooth-transition ${activeTab === 'quotation' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-brand-600 hover:bg-white/50'}`}
              >
                <FileText size={16} />
                LÀM BÁO GIÁ
              </button>
            </nav>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowConfig(true)} className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl smooth-transition"><Settings size={20} /></button>
            <button onClick={() => { if(confirm('Đăng xuất?')) { setUser(null); localStorage.clear(); window.location.reload(); } }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl smooth-transition"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden">
        <div className="max-w-7xl mx-auto p-4 lg:p-6 h-full">
          {/* Mobile Tab Switcher */}
          <div className="md:hidden flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 mb-5 gap-1.5 shadow-sm">
            <button 
              onClick={() => setActiveTab('services')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[12px] font-bold text-[11px] uppercase tracking-widest smooth-transition ${activeTab === 'services' ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-slate-500 bg-transparent hover:bg-slate-50'}`}
            >
              <ClipboardList size={18} />
              PHIẾU
            </button>
            <button 
              onClick={() => setActiveTab('quotation')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[12px] font-bold text-[11px] uppercase tracking-widest smooth-transition ${activeTab === 'quotation' ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-slate-500 bg-transparent hover:bg-slate-50'}`}
            >
              <FileText size={18} />
              BÁO GIÁ
            </button>
          </div>

          {activeTab === 'services' ? (
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 h-full bg-white rounded-[24px] shadow-card border border-slate-100 overflow-hidden flex flex-col">
                <div ref={formScrollRef} className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  <ServiceForm 
                    formData={formData} setFormData={setFormData} technicians={technicians}
                    priceList={priceList} selectedId={selectedId} isSubmitting={isSubmitting}
                    currentUser={user} services={services} bankInfo={config.bankInfo}
                    onClear={() => resetForm()}
                    onCloneCustomer={() => {
                      setSelectedId(null);
                      setFormData(prev => ({
                        ...prev,
                        status: STATUS_OPTIONS[0],
                        content: '',
                        workItems: [{ desc: '', qty: 1, price: '', total: 0 }],
                        revenue: 0, cost: 0, costPayer: 'Công ty', debt: 0
                      }));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      if (formScrollRef.current) {
                        formScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    onSave={() => handleAction('create')}
                    onUpdate={() => handleAction('update')}
                    onUpdateTechnicians={handleUpdateTechnicians}
                    onDelete={async () => {
                       if(!selectedId || !confirm('Xóa phiếu này?')) return;
                       setIsSubmitting(true);
                       try {
                         await callSheetAPI(config.sheetUrl, 'delete', { id: selectedId, role: user?.role });
                         await fetchData(); resetForm();
                         showToast('Đã xóa phiếu thành công!');
                       } catch (e) { alert("Lỗi xóa"); } finally { setIsSubmitting(false); }
                    }}
                    onGoToQuotation={(data) => {
                      setQuotationInitialData(data);
                      setActiveTab('quotation');
                    }}
                  />
                </div>
              </div>

              <div className="lg:col-span-7 h-full flex flex-col min-h-[500px]">
                <ServiceList 
                  data={filteredServices} rawServices={services} loading={loading} technicians={technicians}
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
                      costPayer: item.costPayer || 'Công ty',
                      debt: Number(item.debt || 0)
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (formScrollRef.current) {
                      formScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
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
          ) : (
            <QuotationTool currentUser={user} initialData={quotationInitialData} />
          )}
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
