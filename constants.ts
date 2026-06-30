
import { AppConfig } from './types.ts';

// MÃ TRUY CẬP HỆ THỐNG - Tuyệt đối không cung cấp mã này cho người lạ
export const ACCESS_CODE = "123456"; 
export const CURRENT_VERSION = "1.0.47";
export const DOMAIN_URL = "https://service.diticoms.vn";

// API URL kết nối với Google Apps Script
export const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbz-VIDEbNWSIgzsfFeWUa6y3WXj4vaXdShV287PdZSYqNCAkJFASy79YomuYSiHzboY/exec";

export const DEFAULT_CONFIG: AppConfig = {
  sheetUrl: SHEET_API_URL,
  bankInfo: {
    bankId: 'TCB',
    accountNo: '7929499999',
    accountName: 'NGUYEN PHUOC DUC'
  }
};

export const STATUS_OPTIONS = [
  'Tiếp nhận',
  'Đang sửa chữa',
  'Chưa thanh toán',
  'Hoàn thành',
  'Đã tất toán'
];
