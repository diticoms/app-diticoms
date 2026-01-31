import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Settings, LogOut, Activity, Share2, 
  RefreshCw, Trash2, Plus, Edit, Clipboard, X, Wrench, User as UserIcon, AlertTriangle, Download, Sparkles, Loader2, Github, ExternalLink, CloudDownload
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

// Fallback UUID cho môi trường không có crypto.randomUUID (WebView cũ)
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
      const saved = localStorage.getItem('diti_user');
      if (!saved || saved === "undefined" || saved === "null") return null;
      return JSON.parse(saved);
    } catch { return null; }
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!saved || saved === "undefined") return DEFAULT_CONFIG;
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch { return DEFAULT_CONFIG; }
  });

  const [technicians, setTechnicians] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('diti_techs');
      if (!saved || saved === "undefined") return [];
      return JSON.parse(saved);
    } catch { return []; }
  });

  const [isConfigMode, setIsConfigMode] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{version: string, notes?: string} | null>(null);
  
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

  // Ẩn Splash Screen NGAY LẬP TỨC khi component mount
  useEffect(() => {
    const hideSplash = () => {
      const splash = document.getElementById('splash');
      if (splash) {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        setTimeout(() => splash.remove(), 500);
      }
    };
    hideSplash();
  }, []);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const res = await fetch(`${VERSION_CHECK_URL}?t=${Date.now()}`); 
        const text = (await res.text()).trim();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          const versionMatch = text.match(/(\d+\.\d+\.\d+)/);
          if (versionMatch) data = { version: versionMatch[1] };
        }
        if (data && data.version && isNewerVersion(CURRENT_VERSION, data.version)) {
          setUpdateInfo({ version: data.version, notes: data.notes });
        }
      } catch (e) { 
        console.warn("Lỗi kiểm tra cập nhật:", e); 
      }
    };
    checkUpdates();
  }, []);

  const fetchGlobalSettings = useCallback(async (url: string) => {
    if (!url) return;
    try {
        const response = await callSheetAPI(url, 'read_settings');
        if (response && response.technicians) {
            const techs = response.technicians.map((t: any) => String(t).trim()).filter(Boolean);
            setTechnicians(techs);
            localStorage.setItem('diti_techs', JSON.stringify(techs));
        }
    } catch (e) { console.warn("Lỗi tải cài đặt KTV:", e); }
  }, []);

  const fetchData = useCallback(async () => {
    if (!config.sheetUrl || !currentUser) return;
    setLoadingData(true);
    try {
      const [result, priceResult] = await Promise.all([
        callSheetAPI(config.sheetUrl, 'read', { role: currentUser.role, associatedTech: currentUser.associatedTech }),
        callSheetAPI(config.sheetUrl, 'read_pricelist')
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
    } catch (error) { console.error("Lỗi tải dữ liệu phiếu:", error); }
    finally { setLoadingData(false); }
  }, [config.sheetUrl, currentUser]);

  useEffect(() => { 
    if (config.sheetUrl) {
      fetchGlobalSettings(config.sheetUrl);
      if (currentUser) fetchData();
    }
  }, [config.sheetUrl, currentUser, fetchGlobalSettings, fetchData]);

  const handleShareImage = async () => {
    if (!formData.customerName) { alert("Vui lòng nhập tên khách hàng!"); return; }
    setIsGenerating(true);
    try {
      if (invoiceRef.current) {
        const canvas = await html2canvas(invoiceRef.current, { 
          scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false
        });
        setPreviewImage(canvas.toDataURL('image/png'));
      }
    } catch (e) { alert("Lỗi khi tạo ảnh hóa đơn!"); }
    finally { setIsGenerating(false); }
  };

  const handleCopyZalo = () => {
    const total = formatCurrency(calculateTotalEstimate(formData.workItems));
    const debt = formData.debt || '0';
    const text = `[DITICOMS SERVICE]\n---\nKhách hàng: ${formData.customerName}\nSĐT: ${formData.phone}\nNội dung: ${formData.workItems.map(i => i.desc).join(', ')}\nTổng phí: ${total}đ\nCòn nợ: ${debt}đ\nTrạng thái: ${formData.status}\nHotline: 0935.71.5151\nTrân trọng cảm ơn quý khách!`;
    navigator.clipboard.writeText(text);
    alert("Đã copy nội dung Zalo!");
  };

  const handleDelete = async () => {
    if (!selectedId || !window.confirm("Bạn có chắc muốn xóa phiếu này?")) return;
    setIsSubmitting(true);
    try {
      const response = await callSheetAPI(config.sheetUrl, 'delete', { id: selectedId, role: currentUser?.role });
      if (response.status === 'success' || response.status === 'deleted') {
        setFormData(initialForm); setSelectedId(null); fetchData(); alert("Đã xóa thành công!");
      }
    } catch (e) { alert("Lỗi khi xóa dữ liệu!"); }
    finally { setIsSubmitting(false); }
  };

  const handleLogin = async (username: string, pass: string) => {
    if (!config.sheetUrl) { alert("Vui lòng cấu hình Server!"); setIsConfigMode(true); return; }
    setIsLoggingIn(true);
    try {
        const response = await callSheetAPI(config.sheetUrl, 'login', { username, password: pass });
        if (response.status === 'success' && response.user) {
            setCurrentUser(response.user);
            localStorage.setItem('diti_user', JSON.stringify(response.user));
        } else alert(response.error || "Sai tài khoản!");
    } catch (e: any) { alert("Lỗi kết nối Server!"); }
    finally { setIsLoggingIn(false); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('diti_user');
  };

  const saveToSheet = async (isUpdate: boolean) => {
    if (!formData.customerName || !formData.phone) { alert("Thiếu Tên hoặc SĐT!"); return; }
    setIsSubmitting(true);
    try {
      const id = (isUpdate && selectedId) ? selectedId : generateUUID();
      const payload = {
        ...formData, id, 
        created_at: (isUpdate && selectedId) ? services.find(s => s.id === selectedId)?.created_at : new Date().toISOString(),
        revenue: parseCurrency(formData.revenue), cost: parseCurrency(formData.cost), debt: parseCurrency(formData.debt),
        work_items: formData.workItems, customer_name: formData.customerName,
        action: isUpdate ? 'update' : 'create'
      };
      const response = await callSheetAPI(config.sheetUrl, payload.action, payload);
      if (response.status === 'success' || response.status === 'updated') {
        setFormData(initialForm); setSelectedId(null); fetchData(); alert("Thành công!");
      }
    } catch (error) { alert("Lỗi lưu dữ liệu."); }
    finally { setIsSubmitting(false); }
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
    <div className="min-h-screen p-3 md:p-6 bg-[#f8fafc] text-slate-800 animate-in fade-in duration-500">
      {updateInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300] flex items-end md:items-center justify-center p-4 animate-in slide-in-from-bottom duration-300">
          <div className="bg-white rounded-t-3xl md:rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                <CloudDownload size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase">Bản cập nhật mới!</h3>
              <p className="text-sm text-slate-500 font-medium">Phiên bản <b>v{updateInfo.version}</b> đã sẵn sàng.</p>
            </div>
            <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-colors">CẬP NHẬT NGAY</button>
            <button onClick={() => setUpdateInfo(null)} className="w-full bg-slate-100 text-slate-500 font-bold py-3 rounded-2xl text-xs uppercase">Để sau</button>
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
             <button onClick={() => setShowConfigModal(true)} className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"><Settings size={20}/></button>
             <button onClick={handleLogout} className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"><LogOut size={20}/></button>
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
                  onDelete={handleDelete} onClear={() => {setFormData(initialForm); setSelectedId(null);}} 
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center"><h3 className="font-bold">Xem hóa đơn</h3><button onClick={() => setPreviewImage(null)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
            <img src={previewImage} className="w-full border border-slate-100 rounded-xl" />
            <div className="flex gap-3">
              <button onClick={() => { const l = document.createElement('a'); l.download = `Bill_${formData.customerName}.png`; l.href = previewImage; l.click(); }} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2"><Download size={18}/> LƯU ẢNH</button>
              <button onClick={() => setPreviewImage(null)} className="px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl">ĐÓNG</button>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[110] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
            <Logo size={40} />
          </div>
          <p className="font-bold text-slate-800">Đang tạo hóa đơn...</p>
        </div>
      )}

      {showConfigModal && <ConfigModal config={config} onSave={(c) => { setConfig(c); localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(c)); setShowConfigModal(false); }} onClose={() => setShowConfigModal(false)} isAdmin={currentUser?.role === 'admin'} />}
      {showTechModal && <TechnicianModal technicians={technicians} setTechnicians={setTechnicians} onClose={() => setShowTechModal(false)} sheetUrl={config.sheetUrl} />}
    </div>
  );
}