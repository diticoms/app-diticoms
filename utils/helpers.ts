
import { WorkItem } from '../types.ts';

export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const removeVietnameseTones = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s]/g, '');
};

export const formatCurrency = (val: number | string) => {
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '0';
  return num.toLocaleString('vi-VN');
};

export const parseCurrency = (val: string | number) => {
  if (typeof val === 'number') return val;
  const str = String(val || '0');
  const num = parseInt(str.replace(/\D/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

export const calculateTotalEstimate = (items: WorkItem[] | undefined) => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
};

export const normalizeIdentity = (name: string | undefined) => {
  return (name || '').trim().toLowerCase();
};

export const isNewerVersion = (current: string, latest: string) => {
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (l[i] > c[i]) return true;
    if (l[i] < c[i]) return false;
  }
  return false;
};

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
