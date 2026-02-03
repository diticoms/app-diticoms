
import React from 'react';
import { ServiceFormData, BankConfig } from '../types.ts';
import { formatCurrency, calculateTotalEstimate } from '../utils/helpers.ts';
import { Logo } from './Logo.tsx';
import { CURRENT_VERSION } from '../constants.ts';

interface Props {
  formData: ServiceFormData;
  bankInfo?: BankConfig;
}

export const InvoiceTemplate: React.FC<Props> = ({ formData, bankInfo }) => {
  const total = calculateTotalEstimate(formData.workItems);
  const qrUrl = bankInfo ? `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${total}&addInfo=DITICOMS SERVICE ${formData.customerName.toUpperCase()}&accountName=${encodeURIComponent(bankInfo.accountName)}` : '';

  // Ẩn QR Code nếu trạng thái là "Hoàn thành"
  const showQR = formData.status !== 'Hoàn thành';

  return (
    /* Khối hóa đơn chuẩn 80mm (~302px) */
    <div className="w-[302px] bg-white p-4 mx-auto font-sans shadow-sm" style={{ minHeight: '450px' }}>
      <div className="flex flex-col items-center text-center space-y-1 mb-4">
        <Logo size={50} />
        <h1 className="text-lg font-black uppercase text-blue-600 tracking-tight leading-tight">DITICOMS SERVICE</h1>
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Dịch vụ Sửa chữa & Bảo trì Laptop/PC</p>
        <div className="w-8 h-0.5 bg-blue-600 rounded-full mt-1"></div>
      </div>

      <div className="space-y-1.5 mb-4 text-[11px]">
        <div className="flex justify-between border-b border-slate-50 pb-1">
          <span className="font-bold text-slate-400 uppercase text-[9px]">Khách hàng:</span>
          <span className="font-bold text-slate-900 text-right">{formData.customerName}</span>
        </div>
        <div className="flex justify-between border-b border-slate-50 pb-1">
          <span className="font-bold text-slate-400 uppercase text-[9px]">SĐT:</span>
          <span className="font-bold text-slate-900">{formData.phone}</span>
        </div>
        <div className="flex justify-between border-b border-slate-50 pb-1">
          <span className="font-bold text-slate-400 uppercase text-[9px]">Ngày nhận:</span>
          <span className="font-bold text-slate-900">{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-1.5">Chi tiết dịch vụ</div>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-[9px] text-slate-400 uppercase border-b border-slate-100">
              <th className="pb-1 font-bold">Mô tả</th>
              <th className="pb-1 text-right font-bold">T.Tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {formData.workItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1.5 text-slate-700 font-medium pr-2 leading-tight">
                  {item.desc} {Number(item.qty) > 1 ? <span className="text-slate-400">x{item.qty}</span> : ''}
                </td>
                <td className="py-1.5 text-right font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-2.5 rounded-xl flex justify-between items-center mb-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Tổng cộng:</span>
        <span className="text-base font-black text-blue-600">{formatCurrency(formData.revenue)}đ</span>
      </div>

      {bankInfo && showQR && (
        <div className="flex flex-col items-center space-y-2 pt-4 border-t border-dashed border-slate-200">
           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quét mã thanh toán</div>
           <img src={qrUrl} alt="QR Thanh toán" className="w-36 h-36 border-2 border-white shadow-sm rounded-lg" />
           <div className="text-center">
              <div className="text-[10px] font-black text-slate-800 uppercase leading-none">{bankInfo.bankId} - {bankInfo.accountNo}</div>
              <div className="text-[8px] font-bold text-slate-500 mt-0.5">{bankInfo.accountName}</div>
           </div>
        </div>
      )}

      <div className="text-center pt-4 border-t border-slate-50 mt-4">
        <p className="text-[9px] font-bold text-slate-400 uppercase italic">Cảm ơn quý khách!</p>
        <p className="text-[7px] text-slate-300 mt-1 uppercase">Diticoms Service Manager v{CURRENT_VERSION}</p>
      </div>
    </div>
  );
};
