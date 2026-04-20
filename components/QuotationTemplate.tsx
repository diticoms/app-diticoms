import React from 'react';
import { QuotationData, QuotationItem } from '../types.ts';
import { Logo } from './Logo.tsx';
import { formatCurrency } from '../utils/helpers.ts';

interface Props {
  data: QuotationData;
}

export const QuotationTemplate: React.FC<Props> = ({ data }) => {
  // --- Smart Chunking Logic ---
  const chunks: QuotationItem[][] = [];
  let currentChunk: QuotationItem[] = [];
  let currentUnits = 0;
  
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    let u = 1; // base unit for 1 standard row (~45px)
    if (item.image) u += 6; // Image is unpredictable, reserve more space
    if (item.specs && item.specs.length > 0) u += Math.ceil(item.specs.length / 70) * 0.5;
    if (item.note && item.note.length > 0) u += Math.ceil(item.note.length / 70) * 0.5;

    const isFirstPage = chunks.length === 0;
    const maxUnits = isFirstPage ? 14 : 20; // Increased limits for A4

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

  const maxLastUnits = chunks.length === 1 ? 12 : 16; // Needs space for totals & signatures
  if (lastChunkUnits > maxLastUnits) {
    chunks.push([]); // Empty chunk just for footer to go to new page
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
        <h2 className="text-3xl font-black text-slate-200 uppercase tracking-tighter">BÁO GIÁ</h2>
        <p className="text-xs font-bold text-slate-400">Số: {data.id || 'BQ-' + Date.now().toString().slice(-6)}</p>
        <p className="text-xs font-bold text-slate-400">Ngày: {data.date || new Date().toLocaleDateString('vi-VN')}</p>
      </div>
    </div>
  );

  return (
    <div id="quotation-template" className="flex flex-col gap-4 bg-slate-100 p-4">
      {chunks.map((pageItems, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === chunks.length - 1;
        
        let startingItemIndex = 0;
        for(let i = 0; i < pageIndex; i++) {
          startingItemIndex += chunks[i].length;
        }

        return (
          <div key={pageIndex} className="pdf-page w-[800px] min-h-[1131px] bg-white p-[1cm] font-sans text-slate-800 flex flex-col relative box-border shadow-lg">
            <PageHeader />

            {/* Customer Info ONLY on Page 1 */}
            {isFirstPage && (
              <>
                <div className="grid grid-cols-2 gap-6 mb-4 shrink-0">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Thông tin khách hàng</h3>
                    <p className="text-sm font-bold text-slate-900">{data.customerName || '................................................'}</p>
                    <p className="text-xs text-slate-600">SĐT: {data.customerPhone || '..........................'}</p>
                    <p className="text-xs text-slate-600">Địa chỉ: {data.customerAddress || '................................................'}</p>
                    <p className="text-xs text-slate-600">MST: {data.customerTaxId || '................................................'}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Hiệu lực báo giá</h3>
                    <p className="text-xs text-slate-600">Báo giá có giá trị đến ngày: {data.validUntil || '..........................'}</p>
                  </div>
                </div>
                <div className="mb-3 italic text-sm text-slate-600 shrink-0">
                  Kính gửi Quý khách hàng, Diticoms Service xin chân thành cảm ơn Quý khách đã quan tâm đến dịch vụ của chúng tôi. Dưới đây là nội dung báo giá chi tiết:
                </div>
              </>
            )}

            {/* Table Area */}
            <div className="flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <th className="border border-slate-200 p-2 text-left w-10">STT</th>
                    <th className="border border-slate-200 p-2 text-left">Tên hàng hóa, dịch vụ</th>
                    <th className="border border-slate-200 p-2 text-center w-12">ĐVT</th>
                    <th className="border border-slate-200 p-2 text-center w-12">SL</th>
                    <th className="border border-slate-200 p-2 text-right w-24">Đơn giá</th>
                    <th className="border border-slate-200 p-2 text-right w-28">Thành tiền</th>
                    <th className="border border-slate-200 p-2 text-left w-24">Ghi Chú</th>
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
                      <td className="border border-slate-200 p-2 text-center">{item.quantity}</td>
                      <td className="border border-slate-200 p-2 text-right">{formatCurrency(item.price * 1.2)}</td>
                      <td className="border border-slate-200 p-2 text-right font-bold text-blue-600">{formatCurrency(item.total)}</td>
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
                  {isLastPage && chunks.length === 1 && data.items.length < 5 && Array.from({ length: 5 - data.items.length }).map((_, i) => (
                    <tr key={'empty-' + i} className="h-10 border-b border-slate-50">
                      <td className="border border-slate-200 p-2"></td><td className="border border-slate-200 p-2"></td><td className="border border-slate-200 p-2"></td>
                      <td className="border border-slate-200 p-2"></td><td className="border border-slate-200 p-2"></td><td className="border border-slate-200 p-2"></td>
                      <td className="border border-slate-200 p-2"></td>
                    </tr>
                  ))}
                </tbody>
                
                {/* Tfoot ONLY on Last Page */}
                {isLastPage && (
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-xs">
                      <td colSpan={5} className="border border-slate-200 p-2 text-right uppercase tracking-widest text-slate-400">Cộng tiền hàng:</td>
                      <td className="border border-slate-200 p-2 text-right">{formatCurrency(data.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0))}đ</td>
                      <td className="border border-slate-200 p-2"></td>
                    </tr>
                    {data.vatRate > 0 && (!data.vatType || data.vatType === 'add') && (
                      <tr className="bg-slate-50 font-bold text-xs">
                        <td colSpan={5} className="border border-slate-200 p-2 text-right uppercase tracking-widest text-slate-400">Thuế VAT ({data.vatRate}%):</td>
                        <td className="border border-slate-200 p-2 text-right">{formatCurrency(data.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0) * (data.vatRate / 100))}đ</td>
                        <td className="border border-slate-200 p-2"></td>
                      </tr>
                    )}
                    <tr className="bg-blue-50 font-black">
                      <td colSpan={5} className="border border-slate-200 p-3 text-right uppercase tracking-widest text-sm text-blue-600">Tổng cộng thanh toán:</td>
                      <td className="border border-slate-200 p-3 text-right text-xl text-blue-600">{formatCurrency(data.totalAmount)}đ</td>
                      <td className="border border-slate-200 p-3"></td>
                    </tr>
                    {data.vatRate > 0 && (data.vatType === 'included' || data.vatType === 'none') && (
                      <tr>
                        <td colSpan={7} className="px-3 pt-3 pb-1 border-x border-b border-slate-200">
                          <p className="text-xs font-bold text-slate-600 italic">
                            Ghi chú: {data.vatType === 'included' ? `- ĐÃ BAO GỒM VAT ${data.vatRate}%` : `- Giá trên không bao gồm VAT ${data.vatRate}%`}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>

              {!isLastPage && (
                <div className="text-right mt-2 text-[10px] text-slate-400 italic font-bold">
                  (Xem tiếp trang {pageIndex + 2}...)
                </div>
              )}
            </div>

            {/* Footer Signatures ONLY on Last Page */}
            {isLastPage && (
              <div className="mt-auto pt-4 shrink-0">
                <div className="grid grid-cols-2 gap-10">
                  <div className="text-center space-y-12">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Khách hàng xác nhận</p>
                    <p className="text-xs text-slate-300">(Ký và ghi rõ họ tên)</p>
                  </div>
                  <div className="text-center space-y-12">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Người lập báo giá</p>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900 uppercase">{data.preparedBy || 'CÔNG TY TNHH ĐẦU TƯ-KỸ THUẬT DITICOMS'}</p>
                      <p className="text-[10px] text-slate-400 italic">(Đã ký điện tử)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của Diticoms!</p>
                </div>
              </div>
            )}
            
            {/* Page number */}
            <div className="absolute bottom-4 right-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Trang {pageIndex + 1}/{chunks.length}
            </div>
          </div>
        );
      })}
    </div>
  );
};
