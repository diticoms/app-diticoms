
import { AppConfig } from './types.ts';

export const ACCESS_CODE = "123456"; 
export const CURRENT_VERSION = "1.0.44";
export const DOMAIN_URL = "https://service.diticoms.vn";

// API URL mới nhất
export const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbydOG7vnrXSXF6o0tLU843G_P2Jl9iOCcyuGAI7gRqhLrgmCvMgGj84HKPcfLFf1ZJL/exec";

export const DEFAULT_CONFIG: AppConfig = {
  sheetUrl: SHEET_API_URL,
  bankInfo: {
    bankId: 'TCB',
    accountNo: '7929499999',
    accountName: 'NGUYEN PHUOC DUC'
  }
};

export const STATUS_OPTIONS = [
  'Mới tiếp nhận',
  'Đang sửa chữa',
  'Hoàn thành'
];
