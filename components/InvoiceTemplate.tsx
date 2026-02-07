
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
    <div className="w-[302px] bg-white p-6 mx-auto font-sans block" style={{ height: 'auto', minHeight: 'fit-content' }}>
      <div className="flex flex-col items-center text-center space-y-1 mb-5">
        <Logo size={52} />
        <h1 className="text-xl font-black uppercase text-blue-600 tracking-tight">DITICOMS SERVICE</h1>
        <p className="text-[10px] text-slate-800 font-black uppercase tracking-widest">Hotline: 0847.84.84.84</p>
        <div className="w-12 h-0.5 bg-blue-600 rounded-full mt-1.5"></div>
      </div>

      <div className="space-y-1.5 mb-5 text-[11px]">
        <div className="flex justify-between border-b border-slate-50 pb-1 gap-2">
          <span className="font-bold text-slate-400 uppercase text-[9px] shrink-0">Khách hàng:</span>
          <span className="font-bold text-slate-900 text-right">{formData.customerName}</span>
        </div>
        <div className="flex justify-between border-b border-slate-50 pb-1 gap-2">
          <span className="font-bold text-slate-400 uppercase text-[9px] shrink-0">Điện thoại:</span>
          <span className="font-bold text-slate-900 text-right">{formData.phone}</span>
        </div>
        {formData.address && (
          <div className="flex justify-between border-b border-slate-50 pb-1 gap-2">
            <span className="font-bold text-slate-400 uppercase text-[9px] shrink-0">Địa chỉ:</span>
            <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">{formData.address}</span>
          </div>
        )}
        <div className="flex justify-between border-b border-slate-50 pb-1">
          <span className="font-bold text-slate-400 uppercase text-[9px]">Ngày tạo:</span>
          <span className="font-bold text-slate-900">{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-500 pl-2">Chi tiết dịch vụ</div>
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="text-[8px] text-slate-400 uppercase border-b border-slate-100">
              <th className="pb-2 text-left font-black">Nội dung</th>
              <th className="pb-2 text-center font-black px-1">SL</th>
              <th className="pb-2 text-right font-black px-1">Đơn giá</th>
              <th className="pb-2 text-right font-black">T.Tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {formData.workItems.map((item, idx) => (
              <tr key={idx} className="align-middle">
                <td className="py-2.5 text-slate-800 font-bold leading-tight pr-1">
                  {item.desc}
                </td>
                <td className="py-2.5 text-center text-slate-600 font-black px-1">{item.qty}</td>
                <td className="py-2.5 text-right text-slate-600 font-medium whitespace-nowrap px-1">{formatCurrency(item.price)}</td>
                <td className="py-2.5 text-right font-black text-slate-900 whitespace-nowrap">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center mb-6">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tổng cộng:</span>
        <span className="text-lg font-black text-blue-600">{formatCurrency(formData.revenue)}đ</span>
      </div>

      {bankInfo && formData.status !== 'Hoàn thành' && (
        <div className="flex flex-col items-center space-y-2.5 pt-4 border-t border-dashed border-slate-200">
           <img src={qrUrl} alt="QR" className="w-32 h-32 border-2 border-white shadow-sm rounded-lg" />
           <div className="text-center">
             <p className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">{bankInfo.bankId} • {bankInfo.accountNo}</p>
             <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{bankInfo.accountName}</p>
           </div>
        </div>
      )}

      <div className="text-center pt-6 border-t border-slate-50 mt-6">
        <p className="text-[9px] font-bold text-slate-400 uppercase italic tracking-widest">Trân trọng cảm ơn!</p>
        <p className="text-[7px] text-slate-300 mt-2 font-bold tracking-[0.3em]">SERVICE.DITICOMS.VN</p>
      </div>
    </div>
  );
};
