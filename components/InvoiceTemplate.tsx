
import React from 'react';
import { ServiceFormData, BankConfig } from '../types';
import { formatCurrency, calculateTotalEstimate } from '../utils/helpers';
import { Logo } from './Logo';

interface Props {
  formData: ServiceFormData;
  bankInfo?: BankConfig;
}

export const InvoiceTemplate: React.FC<Props> = ({ formData, bankInfo }) => {
  const total = calculateTotalEstimate(formData.workItems);
  const qrUrl = bankInfo ? `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${total}&addInfo=DITICOMS SERVICE ${formData.customerName}&accountName=${encodeURIComponent(bankInfo.accountName)}` : '';

  return (
    <div className="w-[400px] bg-white p-8 space-y-8 font-sans">
      <div className="flex flex-col items-center text-center space-y-2">
        <Logo size={80} />
        <h1 className="text-2xl font-black uppercase text-blue-600 tracking-tighter">DITICOMS SERVICE</h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Trung tâm sửa chữa & Bảo trì Laptop/PC</p>
        <div className="w-12 h-1 bg-blue-600 rounded-full mt-2"></div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Khách hàng:</span>
          <span className="text-sm font-bold text-slate-900">{formData.customerName}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">SĐT:</span>
          <span className="text-sm font-bold text-slate-900">{formData.phone}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Ngày nhận:</span>
          <span className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 py-2 px-3 rounded-lg text-center">Nội dung sửa chữa</h3>
        <table className="w-full text-xs">
          <thead className="text-slate-400 font-bold border-b border-slate-100">
            <tr>
              <th className="text-left py-2">DỊCH VỤ</th>
              <th className="text-right py-2">THÀNH TIỀN</th>
            </tr>
          </thead>
          <tbody className="font-semibold text-slate-700">
            {formData.workItems.map((item, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-3 pr-4 leading-relaxed">{item.desc} (x{item.qty})</td>
                <td className="py-3 text-right whitespace-nowrap">{formatCurrency(item.total)}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 pt-4">
        <div className="flex justify-between items-center text-lg">
          <span className="font-black text-slate-900 uppercase tracking-tight">Tổng thanh toán:</span>
          <span className="font-black text-blue-600">{formatCurrency(total)}đ</span>
        </div>
        {Number(formData.debt) > 0 && (
          <div className="flex justify-between items-center text-red-500 font-bold">
            <span className="text-xs uppercase">Còn nợ:</span>
            <span>{formatCurrency(formData.debt)}đ</span>
          </div>
        )}
      </div>

      {bankInfo && (
        <div className="flex flex-col items-center bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quét mã chuyển khoản</p>
          <img src={qrUrl} className="w-48 h-48 shadow-lg rounded-2xl border-4 border-white" alt="QR Payment" />
          <div className="text-center">
             <div className="text-[10px] font-bold text-slate-500">{bankInfo.bankId} - {bankInfo.accountNo}</div>
             <div className="text-xs font-black text-slate-900">{bankInfo.accountName}</div>
          </div>
        </div>
      )}

      <div className="text-center pt-4 space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cảm ơn quý khách đã tin tưởng!</p>
        <p className="text-xs font-black text-slate-900 tracking-widest">HOTLINE: 0935.71.5151</p>
      </div>
    </div>
  );
};
