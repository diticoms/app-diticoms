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
  const num = parseInt(val.replace(/\D/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

export const calculateTotalEstimate = (items: WorkItem[]) => {
  return items.reduce((sum, item) => sum + (item.total || 0), 0);
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