
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

      <div className="space-y-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l-2 border-blue-600 pl-2">Nội dung dịch vụ</div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase">
              <th className="pb-2">Mô tả</th>
              <th className="pb-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {formData.workItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2 text-slate-700 font-medium">{item.desc} {Number(item.qty) > 1 ? `(x${item.qty})` : ''}</td>
                <td className="py-2 text-right font-bold text-slate-900">{formatCurrency(item.total)}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase">Tổng thanh toán:</span>
        <span className="text-xl font-black text-blue-600">{formatCurrency(formData.revenue)}đ</span>
      </div>

      {bankInfo && showQR && (
        <div className="flex flex-col items-center space-y-4 pt-4 border-t border-dashed border-slate-200">
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thanh toán chuyển khoản</div>
           <img src={qrUrl} alt="QR Thanh toán" className="w-48 h-48 border-4 border-white shadow-sm rounded-xl" />
           <div className="text-center">
              <div className="text-xs font-black text-slate-800 uppercase">{bankInfo.bankId} - {bankInfo.accountNo}</div>
              <div className="text-[10px] font-bold text-slate-500">{bankInfo.accountName}</div>
           </div>
        </div>
      )}

      <div className="text-center pt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ!</p>
        <p className="text-[9px] text-slate-300 mt-1">Diticoms Service Manager v{CURRENT_VERSION}</p>
      </div>
    </div>
  );
};
