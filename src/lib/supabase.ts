import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  tags: string[];
  is_featured: boolean;
  is_limited_stock: boolean;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  payment_method: 'dp' | 'cod' | 'cash' | 'transfer';
  payment_status: 'pending' | 'dp_paid' | 'paid';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  voucher_code?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  name: string;
  created_at: string;
}

export interface PriceHistory {
  id: string;
  customer_id: string;
  product_id: string;
  negotiated_price: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
}