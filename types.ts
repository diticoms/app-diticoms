
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
  revenue: number;
  cost: number;
  debt: number;
}

export interface ServiceTicket extends ServiceFormData {
  id: string;
  created_at: string; // Ngày nhập phiếu cố định
  search_key?: string;
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
  priceList?: PriceItem[];
}
