
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, Trash2, Download, FileSpreadsheet, FileText, 
  Upload, RefreshCw, ChevronLeft, ChevronRight, Save, X, 
  Search, Printer, Share2, Clipboard, Loader2, Sparkles,
  User, Phone, MapPin, Calendar, Info, CheckCircle2, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QuotationData, QuotationItem } from '../types';
import { formatCurrency, parseCurrency } from '../utils/helpers';
import { QuotationTemplate } from './QuotationTemplate';

const INITIAL_ITEM: QuotationItem = {
  description: '',
  unit: 'Cái',
  quantity: 1,
  price: 0,
  total: 0,
  note: ''
};

const INITIAL_QUOTATION: QuotationData = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  date: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  items: [{ ...INITIAL_ITEM }],
  totalAmount: 0,
  notes: ''
};

export const QuotationTool: React.FC = () => {
  const [data, setData] = useState<QuotationData>(INITIAL_QUOTATION);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);

  // Calculate total amount whenever items change
  useEffect(() => {
    const total = data.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setData(prev => ({ ...prev, totalAmount: total }));
  }, [data.items]);

  const handleAddItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { ...INITIAL_ITEM }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (data.items.length === 1) return;
    const newItems = data.items.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, items: newItems }));
  };

  const handleUpdateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...data.items];
    const item = { ...newItems[index] };
    
    if (field === 'price' || field === 'quantity') {
      const val = field === 'price' ? parseCurrency(value) : Number(value);
      item[field] = val as never;
      item.total = Number(item.quantity) * Number(item.price);
    } else {
      item[field] = value as never;
    }
    
    newItems[index] = item;
    setData(prev => ({ ...prev, items: newItems }));
  };

  const handleExportExcel = () => {
    const wsData = [
      ["DITICOMS SERVICE - TRUNG TÂM SỬA CHỮA & BẢO TRÌ LAPTOP/PC"],
      ["Địa chỉ: 123 Đường ABC, Quận XYZ, TP. HCM"],
      ["Hotline: 0935.71.5151 | Website: service.diticoms.vn"],
      [""],
      ["BÁO GIÁ DỊCH VỤ"],
      ["Số:", data.id || 'BQ-' + Date.now().toString().slice(-6)],
      ["Ngày lập:", data.date],
      [""],
      ["THÔNG TIN KHÁCH HÀNG"],
      ["Tên khách hàng:", data.customerName],
      ["Số điện thoại:", data.customerPhone],
      ["Địa chỉ:", data.customerAddress],
      ["Hiệu lực đến:", data.validUntil],
      [""],
      ["STT", "Tên hàng hóa, dịch vụ (Description)", "ĐVT (Unit)", "Số lượng (Qty)", "Đơn giá (Price)", "Thành tiền", "Ghi chú"]
    ];

    data.items.forEach((item, index) => {
      wsData.push([
        (index + 1).toString(),
        item.description,
        item.unit,
        item.quantity.toString(),
        item.price.toString(),
        item.total.toString(),
        item.note
      ]);
    });

    wsData.push(["", "", "", "", "TỔNG CỘNG THANH TOÁN:", data.totalAmount.toString(), ""]);
    wsData.push([""], ["Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của Diticoms!"]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Basic styling/merging for Excel
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Company Name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Address
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Hotline
      { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }, // Title
    ];
    ws['!merges'] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo giá");
    XLSX.writeFile(wb, `Bao_Gia_${data.customerName.replace(/\s+/g, '_')}_${data.date}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Parsing logic for the improved format (items start at row 15)
        const importedData: Partial<QuotationData> = {
          date: rows[6]?.[1] || new Date().toISOString().split('T')[0],
          customerName: rows[9]?.[1] || '',
          customerPhone: rows[10]?.[1] || '',
          customerAddress: rows[11]?.[1] || '',
          validUntil: rows[12]?.[1] || '',
          items: []
        };

        // Find where items start (row 15, index 14)
        for (let i = 15; i < rows.length; i++) {
          const row = rows[i];
          if (!row[1] || row[4] === "TỔNG CỘNG THANH TOÁN:") break;
          
          importedData.items?.push({
            description: row[1] || '',
            unit: row[2] || 'Cái',
            quantity: Number(row[3]) || 1,
            price: Number(row[4]) || 0,
            total: Number(row[5]) || 0,
            note: row[6] || ''
          });
        }

        if (importedData.items && importedData.items.length > 0) {
          setData(prev => ({ ...prev, ...importedData as QuotationData }));
          alert("Import báo giá thành công!");
        } else {
          // Fallback to old format (row 7)
          const fallbackItems = [];
          for (let i = 7; i < rows.length; i++) {
            const row = rows[i];
            if (!row[1] || row[4] === "TỔNG CỘNG:") break;
            fallbackItems.push({
              description: row[1] || '',
              unit: row[2] || 'Cái',
              quantity: Number(row[3]) || 1,
              price: Number(row[4]) || 0,
              total: Number(row[5]) || 0,
              note: row[6] || ''
            });
          }
          if (fallbackItems.length > 0) {
            setData(prev => ({ ...prev, items: fallbackItems, customerName: rows[2]?.[1] || '' }));
            alert("Import báo giá thành công (định dạng cũ)!");
          } else {
            alert("Không tìm thấy dữ liệu báo giá hợp lệ trong file.");
          }
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleGeneratePdf = async () => {
    if (!data.customerName) {
      alert("Vui lòng nhập tên khách hàng!");
      return;
    }
    setIsGenerating(true);
    setTimeout(async () => {
      if (templateRef.current) {
        try {
          const canvas = await html2canvas(templateRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          const imgWidth = 210; // A4 width in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`Bao_Gia_${data.customerName.replace(/\s+/g, '_')}.pdf`);
          
          // Also set preview for UI
          setPreviewImage(imgData);
        } catch (e) {
          console.error(e);
          alert("Lỗi khi tạo PDF báo giá!");
        } finally {
          setIsGenerating(false);
        }
      }
    }, 500);
  };

  const handleGenerateImage = async () => {
    if (!data.customerName) {
      alert("Vui lòng nhập tên khách hàng!");
      return;
    }
    setIsGenerating(true);
    setTimeout(async () => {
      if (templateRef.current) {
        try {
          const canvas = await html2canvas(templateRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false
          });
          setPreviewImage(canvas.toDataURL('image/png'));
        } catch (e) {
          console.error(e);
          alert("Lỗi khi tạo ảnh báo giá!");
        } finally {
          setIsGenerating(false);
        }
      }
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={24} />
            CÔNG CỤ LẬP BÁO GIÁ
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Tạo, Import và Xuất báo giá chuyên nghiệp</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
          >
            {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            IMPORT BÁO GIÁ
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          <button 
            onClick={() => setData(INITIAL_QUOTATION)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
          >
            <RefreshCw size={16} />
            LÀM MỚI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Form Section */}
        <div className="xl:col-span-8 space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <User size={18} />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Thông tin khách hàng</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên khách hàng</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={data.customerName}
                    onChange={e => setData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Nhập tên khách hàng..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={data.customerPhone}
                    onChange={e => setData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="Nhập SĐT..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={data.customerAddress}
                    onChange={e => setData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    placeholder="Nhập địa chỉ khách hàng..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày báo giá</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date" 
                    value={data.date}
                    onChange={e => setData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hiệu lực đến</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date" 
                    value={data.validUntil}
                    onChange={e => setData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Clipboard size={18} />
                </div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Nội dung báo giá</h3>
              </div>
              <button 
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                <Plus size={16} />
                THÊM MỤC
              </button>
            </div>

            <div className="space-y-4">
              {data.items.map((item, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-left-2 duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Mục #{index + 1}</span>
                    <button 
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên hàng hóa, dịch vụ</label>
                      <input 
                        type="text" 
                        value={item.description}
                        onChange={e => handleUpdateItem(index, 'description', e.target.value)}
                        placeholder="Mô tả dịch vụ..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ĐVT</label>
                      <input 
                        type="text" 
                        value={item.unit}
                        onChange={e => handleUpdateItem(index, 'unit', e.target.value)}
                        placeholder="Cái, Bộ..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-semibold text-center"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SL</label>
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={e => handleUpdateItem(index, 'quantity', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold text-center"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn giá</label>
                      <input 
                        type="text" 
                        value={formatCurrency(item.price)}
                        onChange={e => handleUpdateItem(index, 'price', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold text-right text-blue-600"
                      />
                    </div>
                    <div className="md:col-span-8 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú</label>
                      <input 
                        type="text" 
                        value={item.note}
                        onChange={e => handleUpdateItem(index, 'note', e.target.value)}
                        placeholder="Ghi chú thêm..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs italic"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Thành tiền</label>
                      <div className="w-full bg-blue-100/50 border border-blue-200 rounded-xl py-2.5 px-4 text-sm font-black text-blue-700 text-right">
                        {formatCurrency(item.total)}đ
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary & Export Section */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Sparkles size={18} />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Tổng kết & Xuất file</h3>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Tổng cộng báo giá:</p>
                <p className="text-3xl font-black tracking-tighter">{formatCurrency(data.totalAmount)}đ</p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <button 
                  onClick={handleGeneratePdf}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                  XUẤT FILE PDF
                </button>
                <button 
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                  XUẤT ẢNH BÁO GIÁ
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                >
                  <FileSpreadsheet size={20} />
                  XUẤT FILE EXCEL
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ghi chú hướng dẫn</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Bạn có thể Import file Excel báo giá cũ đã xuất từ hệ thống để cập nhật nhanh thông tin. File ảnh báo giá có thể gửi trực tiếp cho khách hàng qua Zalo/Messenger.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Template for html2canvas */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={templateRef}>
          <QuotationTemplate data={data} />
        </div>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase tracking-tight">Xem trước báo giá</h3>
              <button 
                onClick={() => setPreviewImage(null)} 
                className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-slate-50 p-4">
              <img src={previewImage} alt="Preview Quotation" className="w-full h-auto" />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { 
                  const link = document.createElement('a'); 
                  link.download = `BaoGia_${data.customerName.replace(/\s+/g, '_')}.png`; 
                  link.href = previewImage; 
                  link.click(); 
                }} 
                className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                <Download size={20}/> TẢI ẢNH VỀ MÁY
              </button>
              <button 
                onClick={() => setPreviewImage(null)} 
                className="px-8 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[110] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
          <div className="relative">
            <div className="h-20 w-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 m-auto flex items-center justify-center">
              <FileSpreadsheet className="text-blue-600" size={32} />
            </div>
          </div>
          <p className="font-black text-slate-800 uppercase tracking-widest text-xs animate-pulse">Đang tạo báo giá...</p>
        </div>
      )}
    </div>
  );
};
