import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Settings, LogOut, Activity, Share2, 
  RefreshCw, Trash2, Plus, Edit, Clipboard, X, Wrench, User as UserIcon, AlertTriangle, Download, Sparkles, Loader2, Github, ExternalLink, CloudDownload, WifiOff
} from 'lucide-react';
import html2canvas from 'html2canvas';

import { ServiceForm } from './components/ServiceForm.tsx';
import { ServiceList } from './components/ServiceList.tsx';
import { ConfigModal } from './components/ConfigModal.tsx';
import { TechnicianModal } from './components/TechnicianModal.tsx';
import { InvoiceTemplate } from './components/InvoiceTemplate.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Logo } from './components/Logo.tsx';

import { callSheetAPI } from './services/api.ts';
import { DEFAULT_CONFIG, CURRENT_VERSION, VERSION_CHECK_URL } from './constants.ts';
import { 
  AppConfig, ServiceTicket, PriceItem, 
  ServiceFormData, User
} from './types.ts';
import { 
  getTodayString, formatCurrency, 
  parseCurrency, calculateTotalEstimate, normalizeIdentity, isNewerVersion
} from './utils/helpers.ts';

const CONFIG_STORAGE_KEY = 'diticoms_config_v2';
const USER_STORAGE_KEY = 'diti_user_secure';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch { return null; }
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!saved) return DEFAULT_CONFIG;
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch { return DEFAULT_CONFIG; }
  });

  const [technicians, setTechnicians] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('diti_techs');
      if (!saved) return [];
      return JSON.parse(saved);
    } catch { return []; }
  });

  const [isConfigMode, setIsConfigMode] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{version: string, notes?: string} | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [services, setServices] = useState<ServiceTicket[]>([]);
  const [priceList, setPriceList] = useState<PriceItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm: ServiceFormData = {
    customerName: '', phone: '', address: '', status: 'Mới tiếp nhận', technician: '',
    content: '', workItems: [{ desc: '', qty: 1, price: '', total: 0 }], 
    revenue: '', cost: '', debt: ''
  };
  const [formData, setFormData] = useState<ServiceFormData>(initialForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(getTodayString());
  const [dateTo, setDateTo] = useState(getTodayString());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTech, setSearchTech] = useState('');

  // Theo dõi trạng thái mạng
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Kiểm tra cập nhật
  const checkUpdates = useCallback(async (manual = false) => {
    if (manual) setIsCheckingUpdate(true);
    try {
      const res = await fetch(`${VERSION_CHECK_URL}?t=${Date.now()}`); 
      const data = await res.json();
      if (data && data.version && isNewerVersion(CURRENT_VERSION, data.version)) {
        setUpdateInfo({ version: data.version, notes: data.notes });
      } else if (manual) {
        alert(`Bạn đang dùng bản mới nhất (v${CURRENT_VERSION})`);
      }
    } catch (e) { 
      if (manual) alert("Không thể kiểm tra cập nhật lúc này.");
    } finally {
      if (manual) setIsCheckingUpdate(false);
    }
  }, []);

  useEffect(() => {
    checkUpdates();
    const interval = setInterval(() => checkUpdates(), 3600000);
    return () => clearInterval(interval);
  }, [checkUpdates]);

  const handleApplyUpdate = () => {
    // Xóa toàn bộ cache cũ trước khi tải lại
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('diti_v')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
    window.location.reload();
  };

  const fetchData = useCallback(async () => {
    if (!config.sheetUrl || !currentUser) return;
    setLoadingData(true);
    try {
      const [result, priceResult, techResult] = await Promise.all([
        callSheetAPI(config.sheetUrl, 'read', { role: currentUser.role, associatedTech: currentUser.associatedTech }),
        callSheetAPI(config.sheetUrl, 'read_pricelist'),
        callSheetAPI(config.sheetUrl, 'read_settings')
      ]);

      if (Array.isArray(result)) {
        const mappedData = result.map((row: any) => ({
          ...row,
          customerName: row.customer_name,
          phone: String(row.phone || '').replace(/^'/, ''),
          workItems: typeof row.work_items === 'string' ? JSON.parse(row.work_items) : row.work_items,
          searchKey: `${row.customer_name} ${row.phone} ${row.technician} ${row.id}`.toLowerCase()
        })).reverse();
        setServices(mappedData);
      }

      if (Array.isArray(priceResult)) setPriceList(priceResult);
      
      if (techResult && techResult.technicians) {
        const techs = techResult.technicians.map((t: any) => String(t).trim()).filter(Boolean);
        setTechnicians(techs);
        localStorage.setItem('diti_techs', JSON.stringify(techs));
      }
    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setLoadingData(false);
    }
  }, [config.sheetUrl, currentUser]);

  useEffect(() => { 
    if (currentUser) fetchData();
  }, [currentUser, fetchData]);

  const handleShareImage = async () => {
    if (!formData.customerName) { alert("Thiếu tên khách hàng!"); return; }
    setIsGenerating(true);
    try {
      if (invoiceRef.current) {
        const canvas = await html2canvas(invoiceRef.current, { 
          scale: 3, useCORS: true, backgroundColor: "#ffffff", logging: false,
          allowTaint: true
        });
        setPreviewImage(canvas.toDataURL('image/png'));
      }
    } catch (e) { alert("Lỗi khi tạo ảnh!"); }
    finally { setIsGenerating(false); }
  };

  const handleCopyZalo = () => {
    const total = formatCurrency(calculateTotalEstimate(formData.workItems));
    const text = `[DITICOMS SERVICE]\n---\nKhách hàng: ${formData.customerName}\nSĐT: ${formData.phone}\nNội dung: ${formData.workItems.map(i => i.desc).join(', ')}\nTổng phí: ${total}đ\nTrạng thái: ${formData.status}\nTrân trọng cảm ơn!`;
    navigator.clipboard.writeText(text).then(() => alert("Đã copy nội dung!"));
  };

  const handleLogin = async (username: string, pass: string) => {
    setIsLoggingIn(true);
    try {
        const response = await callSheetAPI(config.sheetUrl, 'login', { username, password: pass });
        if (response.status === 'success' && response.user) {
            setCurrentUser(response.user);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        } else {
            alert(response.error || "Sai tài khoản hoặc mật khẩu!");
        }
    } catch (e) {
        alert("Lỗi kết nối Server. Vui lòng kiểm tra lại URL Server trong phần Cấu hình.");
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn muốn đăng xuất khỏi hệ thống?")) {
      setCurrentUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      setServices([]);
    }
  };

  const saveToSheet = async (isUpdate: boolean) => {
    if (!formData.customerName || !formData.phone) { alert("Vui lòng điền đủ Tên và SĐT!"); return; }
    setIsSubmitting(true);
    try {
      const id = (isUpdate && selectedId) ? selectedId : generateUUID();
      const payload = {
        ...formData, id, 
        created_at: (isUpdate && selectedId) ? services.find(s => s.id === selectedId)?.created_at : new Date().toISOString(),
        revenue: parseCurrency(formData.revenue), 
        cost: parseCurrency(formData.cost), 
        debt: parseCurrency(formData.debt),
        work_items: formData.workItems,
        customer_name: formData.customerName,
        action: isUpdate ? 'update' : 'create'
      };
      
      const response = await callSheetAPI(config.sheetUrl, payload.action, payload);
      if (response.status === 'success' || response.status === 'updated') {
        setFormData(initialForm);
        setSelectedId(null);
        fetchData();
        alert("Đã lưu thành công!");
      }
    } catch (error) {
      alert("Lỗi lưu dữ liệu. Vui lòng kiểm tra mạng!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    return services.filter(item => {
      const isRestricted = currentUser?.role === 'user';
      if (isRestricted && normalizeIdentity(item.technician) !== normalizeIdentity(currentUser?.associatedTech)) return false;
      const itemDate = item.created_at?.split('T')[0];
      const inRange = !searchTerm && (!dateFrom || itemDate >= dateFrom) && (!dateTo || itemDate <= dateTo) || searchTerm;
      const matchesSearch = !searchTerm || item.searchKey?.includes(searchTerm.toLowerCase());
      const matchesTech = !searchTech || item.technician === searchTech;
      return inRange && matchesSearch && matchesTech;
    });
  }, [services, dateFrom, dateTo, searchTerm, searchTech, currentUser]);

  if (!currentUser && !isConfigMode) return <LoginScreen onLogin={handleLogin} onOpenConfig={() => setIsConfigMode(true)} isLoading={isLoggingIn} />;

  if (isConfigMode && !currentUser) return <ConfigModal config={config} onSave={(c) => { setConfig(c); localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(c)); setIsConfigMode(false); }} onClose={() => setIsConfigMode(false)} isAdmin={true} />;

  return (
    <div className="min-h-screen p-3 md:p-6 bg-[#f8fafc] text-slate-800 animate-in">
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-[10px] font-bold text-center py-1 z-[500] flex items-center justify-center gap-2">
          <WifiOff size={12} /> ĐANG NGOẠI TUYẾN - MỘT SỐ TÍNH NĂNG CÓ THỂ KHÔNG HOẠT ĐỘNG
        </div>
      )}

      {updateInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 text-center">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <CloudDownload size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase">Cập nhật mới!</h3>
            <p className="text-sm text-slate-500">Bản <b>v{updateInfo.version}</b> đã sẵn sàng.</p>
            <button 
              onClick={handleApplyUpdate} 
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className="animate-spin-slow" /> CẬP NHẬT NGAY
            </button>
            <button onClick={() => setUpdateInfo(null)} className="text-xs font-bold text-slate-400 uppercase">Để sau</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 overflow-hidden">
              <Logo size={48} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 uppercase">Diticoms</h1>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black">v{CURRENT_VERSION}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1"><UserIcon size={12}/> {currentUser?.name}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded uppercase">{currentUser?.role}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1 md:gap-2">
             <button onClick={() => setShowConfigModal(true)} className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"><Settings size={20}/></button>
             <button onClick={handleLogout} className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"><LogOut size={20}/></button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:sticky lg:top-6">
                <ServiceForm 
                  formData={formData} setFormData={setFormData} technicians={technicians} 
                  priceList={priceList} selectedId={selectedId} isSubmitting={isSubmitting}
                  currentUser={currentUser}
                  onSave={() => saveToSheet(false)} onUpdate={() => saveToSheet(true)}
                  onDelete={() => {}} onClear={() => {setFormData(initialForm); setSelectedId(null);}} 
                  onShareImage={handleShareImage} onCopyZalo={handleCopyZalo} 
                  onOpenTechManager={() => setShowTechModal(true)} services={services}
                />
             </div>
          </div>
          <div className="lg:col-span-8">
            <ServiceList 
              data={filteredData} loading={loadingData} technicians={technicians}
              selectedId={selectedId} onSelectRow={(item) => { setSelectedId(item.id); setFormData(item as any); }}
              filters={{ dateFrom, dateTo, searchTerm, searchTech }}
              setFilters={{ setDateFrom, setDateTo, setSearchTerm, setSearchTech }} 
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>

      <div className="fixed -left-[9999px] top-0 overflow-hidden pointer-events-none">
        <div ref={invoiceRef}><InvoiceTemplate formData={formData} bankInfo={config.bankInfo} /></div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[700] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold">Hóa đơn</h3><button onClick={() => setPreviewImage(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
            <img src={previewImage} className="w-full border rounded-xl" />
            <div className="flex gap-3">
              <button onClick={() => { const a = document.createElement('a'); a.href = previewImage; a.download = `Bill_${formData.customerName}.png`; a.click(); }} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2"><Download size={18}/> TẢI ẢNH</button>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[800] flex flex-col items-center justify-center space-y-4">
          <div className="relative w-16 h-16"><div className="absolute inset-0 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div></div>
          <p className="font-bold text-slate-800 text-xs uppercase tracking-widest">Đang tạo ảnh...</p>
        </div>
      )}

      {showConfigModal && <ConfigModal config={config} onSave={(c) => { setConfig(c); localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(c)); setShowConfigModal(false); }} onClose={() => setShowConfigModal(false)} isAdmin={currentUser?.role === 'admin'} onCheckUpdate={() => checkUpdates(true)} isCheckingUpdate={isCheckingUpdate} />}
      {showTechModal && <TechnicianModal technicians={technicians} setTechnicians={setTechnicians} onClose={() => setShowTechModal(false)} sheetUrl={config.sheetUrl} />}
    </div>
  );
}