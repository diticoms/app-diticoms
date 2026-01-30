
export interface BankConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
}

export interface AppConfig {
  sheetUrl: string;
  bankInfo?: BankConfig;
}

export interface User {
  username: string;
  name: string;
  // Fix: Union types in TypeScript use the single pipe '|' operator, not '||'
  role: 'admin' | 'user';
  associatedTech?: string;
}

export interface WorkItem {
  desc: string;
  qty: number | string;
  price: string | number;
  total: number;
}

export interface ServiceFormData {
  customerName: string;
  phone: string;
  address: string;
  status: string;
  technician: string;
  content: string;
  workItems: WorkItem[];
  revenue: string | number;
  cost: string | number;
  debt: string | number;
}

export interface ServiceTicket extends ServiceFormData {
  id: string;
  created_at: string;
  searchKey?: string;
}

export interface PriceItem {
  name: string;
  price: number;
}

export interface ApiResponse {
  status: 'success' | 'updated' | 'deleted' | 'error';
  error?: string;
  data?: any;
  user?: User;
  technicians?: string[];
}