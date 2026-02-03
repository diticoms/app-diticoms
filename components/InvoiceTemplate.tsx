
import React from 'react';
import { ServiceFormData, BankConfig } from '../types.ts';
import { formatCurrency, calculateTotalEstimate } from '../utils/helpers.ts';
import { Logo } from './Logo.tsx';

interface Props {
  formData: ServiceFormData;
  bankInfo?: BankConfig;
}

export const InvoiceTemplate: React.FC<Props> = ({ formData, bankInfo }) => {
  const total = calculateTotalEstimate(formData.workItems);
  const qrUrl = bankInfo ? `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${total}&addInfo=DITICOMS SERVICE ${formData.customerName.toUpperCase()}&accountName=${encodeURIComponent(bankInfo.accountName)}` : '';

  return (
    /* Fix cứng 302px (80mm), chiều cao tự động để không bị cắt */
    <div className="w-[302px] bg-white p-5 mx-auto font-sans shadow-none border-0 block" style={{ height: 'auto', minHeight: 'fit-content' }}>
      <div className="flex flex-col items-center text-center space-y-1 mb-4">
        <Logo size={48} />
        <h1 className="text-lg font-black uppercase text-blue-600 tracking-tight">DITICOMS SERVICE</h1>
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Sửa chữa & Bảo trì Máy tính</p>
        <div className="w-10 h-0.5 bg-blue-600 rounded-full mt-1"></div>
      </div>

      <div className="space-y-1.5 mb-4 text-[11px]">
        <div className="flex justify-between border-b border-slate-50 pb-1">
          <span className="font-bold text-slate-400 uppercase text-[9px]">Khách:</span>
          <span className="font-bold text-slate-900">{formData.customerName}</span>
        </div>
        <div className="flex justify-between border-b border-slate-50 pb-1">
          <span className="font-bold text-slate-400 uppercase text-[9px]">SĐT:</span>
          <span className="font-bold text-slate-900">{formData.phone}</span>
        </div>
        <div className="flex justify-between border-b border-slate-50 pb-1">
          <span className="font-bold text-slate-400 uppercase text-[9px]">Ngày:</span>
          <span className="font-bold text-slate-900">{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Chi tiết dịch vụ</div>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-[9px] text-slate-400 uppercase border-b">
              <th className="pb-1 font-bold">Mô tả</th>
              <th className="pb-1 text-right font-bold">Tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {formData.workItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1.5 text-slate-700 leading-tight pr-1">
                  {item.desc} {Number(item.qty) > 1 ? `x${item.qty}` : ''}
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

      {bankInfo && formData.status !== 'Hoàn thành' && (
        <div className="flex flex-col items-center space-y-2 pt-2 border-t border-dashed border-slate-200">
           <img src={qrUrl} alt="QR" className="w-32 h-32 border-2 border-white shadow-sm" />
           <p className="text-[9px] font-black text-slate-800 uppercase">{bankInfo.bankId} - {bankInfo.accountNo}</p>
        </div>
      )}

      <div className="text-center pt-5 border-t border-slate-50 mt-4">
        <p className="text-[9px] font-bold text-slate-400 uppercase italic">Cảm ơn quý khách!</p>
        <p className="text-[7px] text-slate-300 mt-1">DITICOMS - SERVICE MANAGER</p>
      </div>
    </div>
  );
};
