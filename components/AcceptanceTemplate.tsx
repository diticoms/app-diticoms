import React from 'react';
import { QuotationData, QuotationItem } from '../types';
import { Logo } from './Logo';

interface Props {
  data: QuotationData;
  isImageMode?: boolean;
}

export const AcceptanceTemplate: React.FC<Props> = ({ data, isImageMode }) => {
  // --- Smart Chunking Logic ---
  const chunks: QuotationItem[][] = [];
  let currentChunk: QuotationItem[] = [];
  let currentUnits = 0;
  
  if (isImageMode) {
    chunks.push([...data.items]);
  } else {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      let u = 1; // base unit for 1 standard row (~45px)
      if (item.image) u += 6; 
      if (item.specs && item.specs.length > 0) u += Math.ceil(item.specs.length / 70) * 0.5;
      if (item.note && item.note.length > 0) u += Math.ceil(item.note.length / 70) * 0.5;

      const isFirstPage = chunks.length === 0;
      const maxUnits = isFirstPage ? 10 : 16; 

      if (currentUnits + u > maxUnits && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [item];
        currentUnits = u;
      } else {
        currentChunk.push(item);
        currentUnits += u;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    // Check if last chunk has enough space for the summary and footer
    const lastChunk = chunks[chunks.length - 1] || [];
    let lastChunkUnits = lastChunk.reduce((sum, item) => {
      let u = 1;
      if (item.image) u += 6;
      if (item.specs && item.specs.length > 0) u += Math.ceil(item.specs.length / 70) * 0.5;
      if (item.note && item.note.length > 0) u += Math.ceil(item.note.length / 70) * 0.5;
      return sum + u;
    }, 0);

    const maxLastUnits = chunks.length === 1 ? 8 : 13; 
    if (lastChunkUnits > maxLastUnits) {
      chunks.push([]); // Empty chunk just for footer to go to new page
    }
  }
  // -----------------------------

  const PageHeader = () => (
    <div className="flex items-center justify-between border-b-2 border-blue-600 pb-4 mb-4 shrink-0">
      <div className="flex items-center gap-4">
        <Logo size={80} />
        <div className="text-left">
          <h1 className="text-lg font-black text-blue-600 uppercase tracking-tighter">CÔNG TY TNHH ĐẦU TƯ-KỸ THUẬT DITICOMS</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dịch vụ sửa chữa & Bảo trì máy tính, máy in, Lắp đặt Camera</p>
          <p className="text-[10px] text-slate-400">MST: 0314369581</p>
          <p className="text-[10px] text-slate-400">Địa chỉ: 145/38/12 Nguyễn Thiện Thuật, Phường Bàn Cờ, TP. HCM</p>
          <p className="text-[10px] text-slate-400">Hotline: 0935.71.5151 | Website: diticoms.vn</p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-black text-slate-200 uppercase tracking-tighter">NGHIỆM THU</h2>
        <p className="text-xs font-bold text-slate-400">Số: {data.id || 'NT-' + Date.now().toString().slice(-6)}</p>
        <p className="text-xs font-bold text-slate-400">Ngày: {data.date || new Date().toLocaleDateString('vi-VN')}</p>
      </div>
    </div>
  );

  return (
    <div id="acceptance-template" className="flex flex-col gap-4 bg-slate-100 p-4">
      {chunks.map((pageItems, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === chunks.length - 1;
        
        let startingItemIndex = 0;
        for(let i = 0; i < pageIndex; i++) {
          startingItemIndex += chunks[i].length;
        }

        return (
          <div key={pageIndex} className={`pdf-page w-[800px] bg-white p-[1cm] font-sans text-slate-800 flex flex-col relative box-border shadow-lg ${isImageMode ? '' : 'min-h-[1131px]'}`}>
            <PageHeader />

            {/* Customer Info ONLY on Page 1 */}
            {isFirstPage && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black uppercase text-slate-900 tracking-wider">BIÊN BẢN NGHIỆM THU</h2>
                  <p className="text-sm font-bold text-slate-500 mt-1">V/v: Lắp đặt, sửa chữa, bàn giao thiết bị/dịch vụ</p>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-4 shrink-0 border border-slate-200 p-4 rounded-xl bg-slate-50">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Bên A (Khách hàng)</h3>
                    <p className="text-sm font-bold text-slate-900">{data.customerName || '................................................'}</p>
                    <p className="text-xs text-slate-600">SĐT: {data.customerPhone || '..........................'}</p>
                    <p className="text-xs text-slate-600">Địa chỉ: {data.customerAddress || '................................................'}</p>
                    <p className="text-xs text-slate-600">MST: {data.customerTaxId || '................................................'}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Bên B (Đơn vị thực hiện)</h3>
                    <p className="text-sm font-bold text-slate-900">CÔNG TY TNHH ĐẦU TƯ-KỸ THUẬT DITICOMS</p>
                    <p className="text-xs text-slate-600">Địa chỉ: 145/38/12 Nguyễn Thiện Thuật, Phường Bàn Cờ, TP. HCM</p>
                    <p className="text-xs text-slate-600">MST: 0314369581</p>
                  </div>
                </div>
                <div className="mb-4 text-sm text-slate-700 leading-relaxed space-y-2 shrink-0">
                  <p><strong>1. Tài liệu làm căn cứ nghiệm thu:</strong> Hồ sơ báo giá và thoả thuận mua bán được duyệt.</p>
                  <p><strong>2. Quy chuẩn, tiêu chuẩn được áp dụng:</strong> {data.acceptanceStandards || '..................................................................'}</p>
                  <p><strong>3. Về số lượng:</strong> Đạt được số lượng theo báo giá đã duyệt. Chi tiết như sau:</p>
                </div>
              </>
            )}

            {/* Table Area */}
            <div className="flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <th className="border border-slate-200 p-2 text-center w-12">STT</th>
                    <th className="border border-slate-200 p-2 text-left">Tên hàng hóa, dịch vụ</th>
                    <th className="border border-slate-200 p-2 text-center w-16">ĐVT</th>
                    <th className="border border-slate-200 p-2 text-center w-16">SL</th>
                    <th className="border border-slate-200 p-2 text-left w-32">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item, idx) => (
                    <tr key={idx} className="text-xs border-b border-slate-100">
                      <td className="border border-slate-200 p-2 text-center">{startingItemIndex + idx + 1}</td>
                      <td className="border border-slate-200 p-2">
                        <div className="font-bold text-slate-900">{item.description}</div>
                        {item.specs && <div className="text-[10px] text-slate-500 mt-1 leading-relaxed whitespace-pre-wrap">{item.specs}</div>}
                      </td>
                      <td className="border border-slate-200 p-2 text-center">{item.unit}</td>
                      <td className="border border-slate-200 p-2 text-center font-bold">{item.quantity}</td>
                      <td className="border border-slate-200 p-2">
                        <div className="space-y-2">
                          {item.note && <p className="text-slate-500 italic leading-tight">{item.note}</p>}
                          {item.image && (
                            <img 
                              src={item.image} 
                              className="max-w-full h-auto rounded border border-slate-100 shadow-sm" 
                              alt="Product" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Fill empty rows if only 1 page to make table look nice */}
                  {isLastPage && chunks.length === 1 && data.items.length < 3 && Array.from({ length: 3 - data.items.length }).map((_, i) => (
                    <tr key={'empty-' + i} className="h-10 border-b border-slate-50">
                      <td className="border border-slate-200 p-2"></td><td className="border border-slate-200 p-2"></td><td className="border border-slate-200 p-2"></td>
                      <td className="border border-slate-200 p-2"></td><td className="border border-slate-200 p-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {isLastPage && (
                <div className="mt-3 text-sm text-slate-700 leading-relaxed space-y-2 shrink-0">
                  <p><strong>4. Chất lượng hạng mục:</strong> Toàn bộ các công tác nêu trên đã được duyệt/thoả thuận và các sửa đổi bổ sung cho phù hợp thực tế và phù hợp với các quy trình quy phạm hiện hành.</p>
                </div>
              )}

              {!isLastPage && (
                <div className="text-right mt-2 text-[10px] text-slate-400 italic font-bold">
                  (Xem tiếp trang {pageIndex + 2}...)
                </div>
              )}
            </div>

            {/* Footer Signatures ONLY on Last Page */}
            {isLastPage && (
              <div className="mt-auto pt-4 shrink-0">
                <div className="grid grid-cols-2 gap-10 mt-6">
                  <div className="text-center space-y-16">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Đại diện Bên A</p>
                    <p className="text-xs text-slate-400">(Ký và ghi rõ họ tên)</p>
                  </div>
                  <div className="text-center space-y-16">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Đại diện Bên B</p>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900 uppercase">................................................</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của Diticoms!</p>
                </div>
              </div>
            )}
            
            {/* Page number */}
            {!isImageMode && (
              <div className="absolute bottom-4 right-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Trang {pageIndex + 1}/{chunks.length}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
