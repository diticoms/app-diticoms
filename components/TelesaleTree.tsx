import React, { useState, useMemo } from 'react';
import { Search, Monitor, Printer, Wifi, Video, ChevronRight, ChevronDown, CheckCircle2, MonitorCheck } from 'lucide-react';

const treeData = [
  {
      id: "pc-mac",
      name: "MÁY TÍNH / LAPTOP / MACBOOK",
      icon: <Monitor size={20} />,
      color: "blue",
      symptoms: [
          {
              id: "os-software",
              name: "Lỗi Phần mềm & Hệ điều hành",
              keywords: ["cài win", "cài mac", "cài phần mềm", "misa", "ecus", "photoshop", "autocad", "virus"],
              script: "Dạ máy mình là máy chạy Windows hay Macbook ạ? Mình cần cài lại hệ điều hành hay cài thêm phần mềm đặc thù ạ?",
              options: [
                  {
                      label: "Khách cần cài lại máy (Windows) -> Cài Win + PM Văn phòng + Diệt virus",
                      action: { solutionText: "Cài Win + PM Văn phòng + Diệt virus", priceEstimate: "220.000 VNĐ", note: "" }
                  },
                  {
                      label: "Khách dùng Macbook cần cài lại macOS -> Cài macOS & phần mềm cho Mac",
                      action: { solutionText: "Cài macOS & phần mềm cho Mac", priceEstimate: "300.000 VNĐ", note: "" }
                  },
                  {
                      label: "Khách cần cài phần mềm đặc thù (Misa, Photoshop, AutoCAD...) -> Cài đặt & sửa lỗi PM",
                      action: { solutionText: "Cài đặt & sửa lỗi PM chuyên dụng", priceEstimate: "180.000 VNĐ", note: "" }
                  },
                  {
                      label: "Máy chủ/Kế toán -> Cài Win & PM máy chủ ECUS, MISA",
                      action: { solutionText: "Cài Win & PM máy chủ ECUS, MISA", priceEstimate: "250.000 VNĐ", note: "" }
                  },
                  {
                      label: "Hỗ trợ nhẹ từ xa (Ultraview/Teamview) -> Kiểm tra & sửa lỗi",
                      action: { solutionText: "Kiểm tra & sửa lỗi qua Ultraview/Teamview", priceEstimate: "Miễn phí", note: "" }
                  }
              ]
          },
          {
              id: "hardware-power",
              name: "Lỗi Phần cứng & Nguồn",
              keywords: ["không lên", "bật không lên", "im re", "đen thui", "chập cháy", "lỗi main", "nguồn"],
              script: "Dạ máy bật hoàn toàn không có tín hiệu điện, hay bật có sáng đèn quạt quay nhưng màn hình đen ạ?",
              options: [
                  {
                      label: "Bật không lên (Nghi lỏng RAM, sốc điện) -> Xử lý tại chỗ",
                      action: { solutionText: "Xử lý tại chỗ (Xả điện, lau RAM)", priceEstimate: "120.000 VNĐ", note: "" }
                  },
                  {
                      label: "Lỗi nặng (Chập cháy, lỗi Mainboard, IC, Nguồn) -> KTV mang máy về hoặc sửa sâu",
                      action: { solutionText: "KTV mang máy về hoặc sửa sâu (Lỗi Mainboard, IC, Nguồn)", priceEstimate: "Từ 400.000 VNĐ", note: "Báo khách KTV sẽ kiểm tra thực tế và báo giá chi tiết." }
                  }
              ]
          },
          {
              id: "cleaning",
              name: "Vệ sinh & Bảo dưỡng",
              keywords: ["vệ sinh", "bảo dưỡng", "tra keo", "nóng máy", "kêu to"],
              script: "Dạ máy của mình là máy tính bàn văn phòng, Laptop phổ thông hay dòng máy Gaming/Đồ họa ạ?",
              options: [
                  {
                      label: "Máy tính bàn (PC) văn phòng -> Vệ sinh, tra keo tản nhiệt",
                      action: { solutionText: "Vệ sinh, tra keo tản nhiệt cho PC văn phòng", priceEstimate: "250.000 VNĐ", note: "" }
                  },
                  {
                      label: "Laptop phổ thông -> Vệ sinh, tra keo tản nhiệt",
                      action: { solutionText: "Vệ sinh, tra keo tản nhiệt Laptop phổ thông", priceEstimate: "280.000 VNĐ", note: "" }
                  },
                  {
                      label: "PC/Laptop Gaming, Đồ họa, Máy chủ -> Vệ sinh chuyên sâu",
                      action: { solutionText: "Vệ sinh chuyên sâu cho dòng Gaming, Đồ họa, Máy chủ", priceEstimate: "350.000 VNĐ - 380.000 VNĐ", note: "" }
                  }
              ]
          }
      ]
  },
  {
      id: "printer",
      name: "MÁY IN & PHOTOCOPY",
      icon: <Printer size={20} />,
      color: "emerald",
      symptoms: [
          {
              id: "ink-issues",
              name: "Vấn đề về Mực in & Bản in",
              keywords: ["hết mực", "đổ mực", "bơm mực", "in mờ", "sọc đen", "lem mực", "chấm đen", "máy in màu", "nhòe"],
              script: "Dạ máy của mình đang bị báo hết mực, in mờ, hay bản in có vệt sọc đen/nhòe mực ạ?",
              options: [
                  {
                      label: "Hết mực máy in thường (Canon, HP, Brother) -> Đổ mực",
                      action: { solutionText: "Đổ mực máy in thường", priceEstimate: "150.000 VNĐ", note: "" }
                  },
                  {
                      label: "Hết mực máy Photocopy -> Đổ mực",
                      action: { solutionText: "Đổ mực máy Photocopy", priceEstimate: "500.000 VNĐ", note: "" }
                  },
                  {
                      label: "Bản in bị đen, mờ vệt -> Thay Trống / Trục từ",
                      action: { solutionText: "Thay Trống hoặc Trục từ", priceEstimate: "150.000 VNĐ", note: "Do hỏng linh kiện hộp mực." }
                  },
                  {
                      label: "Bản in bị đen, mờ vệt -> Thay Trục cao su",
                      action: { solutionText: "Thay Trục cao su", priceEstimate: "100.000 VNĐ", note: "Do hỏng linh kiện hộp mực." }
                  },
                  {
                      label: "Bản in bị đen, mờ vệt -> Thay Gạt to / Gạt nhỏ",
                      action: { solutionText: "Thay Gạt to / Gạt nhỏ", priceEstimate: "80.000 VNĐ", note: "Do hỏng linh kiện hộp mực." }
                  },
                  {
                      label: "Bản in bị đen, mờ vệt -> Thay Hộp mực mới",
                      action: { solutionText: "Thay nguyên Hộp mực mới", priceEstimate: "650.000 VNĐ", note: "Khuyên dùng nếu hộp mực cũ đã hỏng nhiều linh kiện." }
                  },
                  {
                      label: "Máy in màu in nhòe, tắc mực -> Clear đầu phun",
                      action: { solutionText: "Clear đầu phun máy in màu", priceEstimate: "150.000 VNĐ", note: "" }
                  }
              ]
          },
          {
              id: "mechanical-issues",
              name: "Vấn đề Cơ học & Kết nối",
              keywords: ["kẹt giấy", "không kéo giấy", "không nhận lệnh", "không nhận khay"],
              script: "Dạ máy báo lỗi không in được, kẹt giấy hay máy Photo không nhận khay giấy ạ?",
              options: [
                  {
                      label: "Máy in không kéo giấy, kẹt giấy, không nhận lệnh -> Sửa lỗi",
                      action: { solutionText: "Sửa lỗi máy in không kéo giấy, kẹt giấy, không nhận lệnh", priceEstimate: "80.000 VNĐ", note: "" }
                  },
                  {
                      label: "Máy Photocopy mờ, không nhận khay giấy -> Sửa lỗi",
                      action: { solutionText: "Sửa lỗi máy Photocopy mờ, không nhận khay giấy", priceEstimate: "300.000 VNĐ", note: "" }
                  }
              ]
          },
          {
              id: "printer-cleaning",
              name: "Vệ sinh máy in",
              keywords: ["vệ sinh máy in", "vệ sinh máy photo"],
              script: "Dạ mình cần vệ sinh máy in thường hay máy Photocopy lớn ạ?",
              options: [
                  {
                      label: "Máy in thường / Máy in màu -> Vệ sinh",
                      action: { solutionText: "Vệ sinh máy in thường / Máy in màu", priceEstimate: "150.000 VNĐ - 180.000 VNĐ", note: "" }
                  },
                  {
                      label: "Máy Photocopy -> Vệ sinh",
                      action: { solutionText: "Vệ sinh máy Photocopy", priceEstimate: "250.000 VNĐ", note: "" }
                  }
              ]
          }
      ]
  },
  {
      id: "network-camera",
      name: "THI CÔNG MẠNG & CAMERA",
      icon: <Wifi size={20} />,
      color: "amber",
      symptoms: [
          {
              id: "network-issues",
              name: "Hệ thống Mạng (LAN/Wifi)",
              keywords: ["mạng lỗi", "rớt mạng", "thay pass", "cấu hình", "kéo dây", "lan", "chia sẻ máy in"],
              script: "Dạ anh/chị cần sửa lỗi mạng, kéo dây mới hay khảo sát hệ thống lớn ạ?",
              options: [
                  {
                      label: "Mạng lỗi, rớt mạng, thay pass wifi -> Cấu hình modem, router, wifi",
                      action: { solutionText: "Cấu hình modem, router, wifi", priceEstimate: "150.000 VNĐ", note: "" }
                  },
                  {
                      label: "Kéo dây LAN, cài chia sẻ máy in/dữ liệu trong mạng -> Phí thi công",
                      action: { solutionText: "Phí thi công theo máy", priceEstimate: "100.000 VNĐ / máy", note: "" }
                  },
                  {
                      label: "Dự án lớn -> Tính theo nhân công",
                      action: { solutionText: "Tính theo nhân công", priceEstimate: "800.000 VNĐ / ngày / 1 nhân công", note: "" }
                  },
                  {
                      label: "Khách cần khảo sát trước -> Tư vấn khảo sát hệ thống",
                      action: { solutionText: "Tư vấn khảo sát hệ thống", priceEstimate: "Miễn phí", note: "" }
                  }
              ]
          },
          {
              id: "camera-install",
              name: "Camera",
              keywords: ["lắp camera", "di dời camera", "camera"],
              script: "Dạ anh/chị cần lắp mới camera hay di dời sang vị trí khác ạ?",
              options: [
                  {
                      label: "Lắp đặt mới hoặc Di dời camera sang vị trí khác -> Phí dịch vụ",
                      action: { solutionText: "Lắp đặt mới hoặc Di dời camera sang vị trí khác", priceEstimate: "280.000 VNĐ / mắt", note: "Giá dịch vụ trên 1 mắt camera." }
                  }
              ]
          }
      ]
  }
];

export const TelesaleTree: React.FC<{
  onCreateTicket: (data: { content: string; estimatedPrice: string }) => void;
}> = ({ onCreateTicket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);

  const searchResults = useMemo(() => {
      if (!searchTerm) return [];
      const term = searchTerm.toLowerCase();
      const results: any[] = [];
      treeData.forEach(cat => {
          cat.symptoms.forEach(symp => {
              if (
                  symp.name.toLowerCase().includes(term) ||
                  symp.keywords.some(k => k.toLowerCase().includes(term))
              ) {
                  results.push({ catName: cat.name, ...symp });
              }
          });
      });
      return results;
  }, [searchTerm]);

  const getColorClasses = (color: string, isActive: boolean) => {
    switch(color) {
      case 'blue': return isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100';
      case 'emerald': return isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
      case 'amber': return isActive ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'bg-amber-50 text-amber-700 hover:bg-amber-100';
      default: return isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-slate-50 text-slate-700 hover:bg-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-card border border-slate-100 p-6 max-w-4xl mx-auto flex flex-col min-h-[500px]">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
          CHẨN ĐOÁN & <span className="gradient-text">BÁO GIÁ NHANH</span>
        </h2>
        <p className="text-slate-500 text-sm mt-2">Dành cho Telesale / CSKH tiếp nhận yêu cầu từ khách hàng</p>
      </div>

      <div className="relative mb-8 max-w-2xl mx-auto w-full">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={20} className="text-slate-400" />
          </div>
          <input
              type="text"
              placeholder="Tìm nhanh triệu chứng (VD: kẹt giấy, cài win, màn hình xanh...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 font-medium text-slate-700 text-sm transition-all"
          />
      </div>

      <div className="flex-1">
        {searchTerm ? (
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Kết quả tìm kiếm ({searchResults.length})</h3>
                {searchResults.length > 0 ? (
                    searchResults.map((symp, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-brand-300 transition-colors">
                            <div className="flex items-center gap-2 mb-2 text-brand-600">
                                <span className="text-xs font-bold bg-brand-100 px-2 py-1 rounded-md">{symp.catName}</span>
                                <ChevronRight size={14} className="text-slate-300" />
                                <span className="text-sm font-bold text-slate-800">{symp.name}</span>
                            </div>
                            {symp.script && (
                              <div className="bg-brand-50 text-brand-800 text-sm p-3 rounded-xl italic mb-4 border border-brand-100">
                                  "{symp.script}"
                              </div>
                            )}
                            <div className="grid gap-2">
                                {symp.options.map((opt: any, j: number) => (
                                    <div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-xl border border-slate-200 gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 text-brand-500"><MonitorCheck size={16} /></div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{opt.label}</div>
                                                {opt.action.note && <div className="text-xs text-slate-500 mt-1">{opt.action.note}</div>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 ml-7 sm:ml-0">
                                            <div className="font-black text-brand-600 text-sm whitespace-nowrap">{opt.action.priceEstimate}</div>
                                            <button 
                                                onClick={() => onCreateTicket({ content: opt.action.solutionText, estimatedPrice: opt.action.priceEstimate })}
                                                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                                            >
                                                Tạo Phiếu
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        Không tìm thấy kết quả nào phù hợp với "{searchTerm}"
                    </div>
                )}
            </div>
        ) : (
            <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {treeData.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setSelectedCategory(cat.id); setSelectedSymptom(null); }}
                            className={`flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-300 border border-transparent ${getColorClasses(cat.color, selectedCategory === cat.id)}`}
                        >
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                              {cat.icon}
                            </div>
                            <span className="font-bold text-sm tracking-wide text-center">{cat.name}</span>
                        </button>
                    ))}
                </div>

                {selectedCategory && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Chọn Triệu chứng / Yêu cầu</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {treeData.find(c => c.id === selectedCategory)?.symptoms.map(symp => (
                                <button
                                    key={symp.id}
                                    onClick={() => setSelectedSymptom(selectedSymptom === symp.id ? null : symp.id)}
                                    className={`flex items-center justify-between text-left p-4 rounded-xl border transition-all ${selectedSymptom === symp.id ? 'bg-white border-brand-500 shadow-sm ring-1 ring-brand-500 text-brand-700' : 'bg-white border-slate-200 hover:border-brand-300 text-slate-700'}`}
                                >
                                    <span className="font-bold text-sm">{symp.name}</span>
                                    {selectedSymptom === symp.id ? <ChevronDown size={16} className="text-brand-500" /> : <ChevronRight size={16} className="text-slate-400" />}
                                </button>
                            ))}
                        </div>

                        {selectedSymptom && (
                            <div className="mt-4 bg-white border border-brand-200 rounded-2xl p-5 shadow-sm animate-in fade-in zoom-in-95">
                                {treeData.find(c => c.id === selectedCategory)?.symptoms.find(s => s.id === selectedSymptom)?.script && (
                                    <div className="bg-brand-50 text-brand-800 text-sm p-4 rounded-xl italic mb-5 border border-brand-100 flex items-start gap-3">
                                      <div className="mt-0.5"><CheckCircle2 size={16} className="text-brand-500" /></div>
                                      "{treeData.find(c => c.id === selectedCategory)?.symptoms.find(s => s.id === selectedSymptom)?.script}"
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {treeData.find(c => c.id === selectedCategory)?.symptoms.find(s => s.id === selectedSymptom)?.options.map((opt: any, j: number) => (
                                        <div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 gap-4 hover:bg-white transition-colors">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="mt-0.5 text-slate-400"><MonitorCheck size={16} /></div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm">{opt.label}</div>
                                                    {opt.action.note && <div className="text-xs text-slate-500 mt-1.5">{opt.action.note}</div>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 ml-7 sm:ml-0">
                                                <div className="font-black text-brand-600 text-sm whitespace-nowrap bg-brand-50 px-3 py-1 rounded-lg">{opt.action.priceEstimate}</div>
                                                <button 
                                                    onClick={() => onCreateTicket({ content: opt.action.solutionText, estimatedPrice: opt.action.priceEstimate })}
                                                    className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm whitespace-nowrap active:scale-95"
                                                >
                                                    Tạo Phiếu
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
