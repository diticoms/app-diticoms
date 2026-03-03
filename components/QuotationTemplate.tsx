
import React from 'react';
import { QuotationData } from '../types';
import { Logo } from './Logo';
import { formatCurrency } from '../utils/helpers';

interface Props {
  data: QuotationData;
}

export const QuotationTemplate: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-[800px] bg-white p-10 font-sans text-slate-800" id="quotation-template">
      {/* Header: Logo and Company Info */}
      <div className="flex items-center justify-between border-b-2 border-blue-600 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <Logo size={80} />
          <div className="text-left">
            <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">CÔNG TY TNHH ĐẦU TƯ-KỸ THUẬT DITICOMS</h1>
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

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Thông tin khách hàng</h3>
          <p className="text-sm font-bold text-slate-900">{data.customerName || '................................................'}</p>
          <p className="text-xs text-slate-600">SĐT: {data.customerPhone || '..........................'}</p>
          <p className="text-xs text-slate-600">Địa chỉ: {data.customerAddress || '................................................'}</p>
        </div>
        <div className="text-right space-y-1">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Hiệu lực báo giá</h3>
          <p className="text-xs text-slate-600">Báo giá có giá trị đến ngày: {data.validUntil || '..........................'}</p>
        </div>
      </div>

      {/* Thank you message */}
      <div className="mb-6 italic text-sm text-slate-600">
        Kính gửi Quý khách hàng, Diticoms Việt Nam xin chân thành cảm ơn Quý khách đã quan tâm đến dịch vụ của chúng tôi. Dưới đây là nội dung báo giá chi tiết:
      </div>

      {/* Quotation Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <th className="border p-3 text-left w-10">STT</th>
            <th className="border p-3 text-left">Tên hàng hóa, dịch vụ (Description)</th>
            <th className="border p-3 text-center w-16">ĐVT (Unit)</th>
            <th className="border p-3 text-center w-16">SL (Qty)</th>
            <th className="border p-3 text-right w-24">Đơn giá (Price)</th>
            <th className="border p-3 text-right w-28">Thành tiền</th>
            <th className="border p-3 text-left w-24">Ghi Chú</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index} className="text-xs border-b border-slate-100">
              <td className="border p-3 text-center">{index + 1}</td>
              <td className="border p-3">
                <div className="font-bold text-slate-900">{item.description}</div>
                {item.specs && <div className="text-[10px] text-slate-500 mt-1 leading-relaxed whitespace-pre-wrap">{item.specs}</div>}
              </td>
              <td className="border p-3 text-center">{item.unit}</td>
              <td className="border p-3 text-center">{item.quantity}</td>
              <td className="border p-3 text-right">{formatCurrency(item.price)}</td>
              <td className="border p-3 text-right font-bold text-blue-600">{formatCurrency(item.total)}</td>
              <td className="border p-3">
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
          {/* Fill empty rows if needed */}
          {data.items.length < 5 && Array.from({ length: 5 - data.items.length }).map((_, i) => (
            <tr key={'empty-' + i} className="h-10 border-b border-slate-50">
              <td className="border p-3"></td>
              <td className="border p-3"></td>
              <td className="border p-3"></td>
              <td className="border p-3"></td>
              <td className="border p-3"></td>
              <td className="border p-3"></td>
              <td className="border p-3"></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 font-bold text-xs">
            <td colSpan={5} className="border p-3 text-right uppercase tracking-widest text-slate-400">Cộng tiền hàng:</td>
            <td className="border p-3 text-right">{formatCurrency(data.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0))}đ</td>
            <td className="border p-3"></td>
          </tr>
          {data.vatRate > 0 && (
            <tr className="bg-slate-50 font-bold text-xs">
              <td colSpan={5} className="border p-3 text-right uppercase tracking-widest text-slate-400">Thuế VAT ({data.vatRate}%):</td>
              <td className="border p-3 text-right">{formatCurrency(data.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0) * (data.vatRate / 100))}đ</td>
              <td className="border p-3"></td>
            </tr>
          )}
          <tr className="bg-blue-50 font-black">
            <td colSpan={5} className="border p-4 text-right uppercase tracking-widest text-sm text-blue-600">Tổng cộng thanh toán:</td>
            <td className="border p-4 text-right text-xl text-blue-600">{formatCurrency(data.totalAmount)}đ</td>
            <td className="border p-4"></td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div className="grid grid-cols-2 gap-10 mt-12">
        <div className="text-center space-y-16">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Khách hàng xác nhận</p>
          <p className="text-xs text-slate-300">(Ký và ghi rõ họ tên)</p>
        </div>
        <div className="text-center space-y-16">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Người lập báo giá</p>
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-900 uppercase">{data.preparedBy || 'DITICOMS VIỆT NAM'}</p>
            <p className="text-[10px] text-slate-400 italic">(Đã ký điện tử)</p>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của Diticoms!</p>
      </div>
    </div>
  );
};
