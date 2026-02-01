import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LoginScreen } from './components/LoginScreen.tsx';
import { ServiceList } from './components/ServiceList.tsx';
import { ServiceForm } from './components/ServiceForm.tsx';
import { ConfigModal } from './components/ConfigModal.tsx';
import { TechnicianModal } from './components/TechnicianModal.tsx';
import { callSheetAPI } from './services/api.ts';
import { User, AppConfig, ServiceTicket, ServiceFormData } from './types.ts';
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
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    dateFrom: getTodayString(),
    dateTo: getTodayString(),
    searchTerm: '',
    searchTech: ''
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
      const response = await callSheetAPI(config.sheetUrl, 'get_data');
      if (response.data) setServices(response.data);
      if (response.technicians) {
        setTechnicians(response.technicians);
        localStorage.setItem('diti_techs', JSON.stringify(response.technicians));
      }
    } catch (e: any) {
      console.error('Data Fetch Error:', e);
    } finally {
      setLoading(false);
    }
  }, [user, config.sheetUrl]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleLogin = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const u = username.trim();
      const p = pass.trim();

      const response = await callSheetAPI(config.sheetUrl, 'login', { 
        username: u, 
        user: u, 
        pass: p, 
        password: p 
      });

      if (response.status === 'success' && response.user) {
        setUser(response.user);
        localStorage.setItem('diti_user', JSON.stringify(response.user));
      } else {
        alert(response.error || 'Sai tài khoản hoặc mật khẩu.');
      }
    } catch (e: any) {
      alert('Lỗi kết nối Server: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn muốn đăng xuất?')) {
      setUser(null);
      localStorage.removeItem('diti_user');
      setServices([]);
    }
  };

  const handleSave = async () => {
    if (!formData.customerName || !formData.phone) {
      alert('Vui lòng điền đủ tên khách và SĐT');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await callSheetAPI(config.sheetUrl, 'save_ticket', formData);
      if (response.status === 'success') {
        alert('Lưu phiếu thành công!');
        fetchData();
        handleClear();
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    try {
      const response = await callSheetAPI(config.sheetUrl, 'update_ticket', { ...formData, id: selectedId });
      if (response.status === 'updated') {
        alert('Cập nhật thành công!');
        fetchData();
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !window.confirm('Xác nhận xóa phiếu này?')) return;
    setIsSubmitting(true);
    try {
      const response = await callSheetAPI(config.sheetUrl, 'delete_ticket', { id: selectedId });
      if (response.status === 'deleted') {
        alert('Đã xóa phiếu!');
        fetchData();
        handleClear();
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setSelectedId(null);
    setFormData({
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
  };

  const handleSelectRow = (item: ServiceTicket) => {
    setSelectedId(item.id);
    setFormData({ ...item });
  };

  const filteredData = useMemo(() => {
    return services.filter(item => {
      const matchesSearch = !filters.searchTerm || 
        item.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.phone.includes(filters.searchTerm) ||
        item.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (item.technician || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesTech = !filters.searchTech || item.technician === filters.searchTech;
      
      const itemDate = (item.created_at || '').split('T')[0];
      const matchesDate = itemDate >= filters.dateFrom && itemDate <= filters.dateTo;
      
      return matchesSearch && matchesTech && matchesDate;
    });
  }, [services, filters]);

  const handleCopyZalo = () => {
    const itemsText = formData.workItems.map(i => `- ${i.desc}: ${Number(i.total).toLocaleString('vi-VN')}đ`).join('\n');
    const total = formData.workItems.reduce((s, i) => s + (Number(i.total) || 0), 0);
    const text = `DITICOMS SERVICE\nKhách hàng: ${formData.customerName}\nSĐT: ${formData.phone}\nNội dung:\n${itemsText}\n------------------\nTỔNG: ${total.toLocaleString('vi-VN')}đ`;
    navigator.clipboard.writeText(text);
    alert('Đã copy nội dung Zalo!');
  };

  if (!user) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        isLoading={loading} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="font-black text-slate-900 text-lg uppercase tracking-tighter">DITICOMS SERVICE</h1>
            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{user.role}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowConfig(true)} className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Cấu hình</button>
            <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline">Đăng xuất</button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 xl:col-span-4 h-fit lg:sticky lg:top-24">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 transition-all">
              <ServiceForm 
                formData={formData}
                setFormData={setFormData}
                technicians={technicians}
                priceList={[]}
                selectedId={selectedId}
                isSubmitting={isSubmitting}
                currentUser={user}
                onSave={handleSave}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onClear={handleClear}
                onShareImage={() => alert('Sử dụng trình duyệt di động hoặc công chụp màn hình để xuất ảnh Bill.')}
                onCopyZalo={handleCopyZalo}
                onOpenTechManager={() => setShowTechModal(true)}
                services={services}
              />
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-8">
            <ServiceList 
              data={filteredData}
              loading={loading}
              technicians={technicians}
              selectedId={selectedId}
              onSelectRow={handleSelectRow}
              filters={filters}
              setFilters={{
                setDateFrom: (v) => setFilters(f => ({ ...f, dateFrom: v })),
                setDateTo: (v) => setFilters(f => ({ ...f, dateTo: v })),
                setSearchTerm: (v) => setFilters(f => ({ ...f, searchTerm: v })),
                setSearchTech: (v) => setFilters(f => ({ ...f, searchTech: v }))
              }}
              currentUser={user}
            />
          </div>
        </div>
      </main>

      {showConfig && (
        <ConfigModal 
          config={config} 
          onClose={() => setShowConfig(false)} 
          isAdmin={user.role === 'admin'} 
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