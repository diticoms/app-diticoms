import { AppConfig } from './types';

export const ACCESS_CODE = "123456"; 
export const CURRENT_VERSION = "1.0.1";
export const GITHUB_REPO = "https://github.com/diticoms/diticoms-app";
export const VERSION_CHECK_URL = "https://raw.githubusercontent.com/diticoms/diticoms-app/main/version.json";
export const DOMAIN_URL = "https://service.diticoms.vn";

// API URL MỚI ĐÃ ĐƯỢC CẬP NHẬT
export const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwJZ1eTmohBOqDgUPugEJQKoF-1YtJ1PW-M7LQc1dzCKdoc8D04uNisfFoDAryUeF7K/exec";

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
  'Đang kiểm tra',
  'Đang sửa chữa',
  'Chờ linh kiện',
  'Hoàn thành',
  'Đã trả khách'
];