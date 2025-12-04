import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  category_id: string | null;
  purchase_price: number;
  sale_price: number;
  tax_rate: number;
  stock_qty: number;
  low_stock_threshold: number;
  image_url: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  tax_rate: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  product_id: string;
  movement_type: 'purchase' | 'sale' | 'adjustment';
  quantity: number;
  purchase_price: number;
  reference_id: string | null;
  notes: string;
  created_by: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  created_by: string | null;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  item_type: 'product' | 'service';
  product_id: string | null;
  service_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
};

export type Settings = {
  id: string;
  key: string;
  value: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
};