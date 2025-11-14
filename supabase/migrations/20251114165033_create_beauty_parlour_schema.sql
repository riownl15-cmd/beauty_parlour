/*
  # Beauty Parlour Billing System Schema

  ## Overview
  Complete database schema for beauty parlour billing system with products, services, inventory, invoicing, and reporting capabilities.

  ## New Tables

  ### 1. `categories`
  Product categorization system
  - `id` (uuid, primary key)
  - `name` (text, unique) - Category name
  - `description` (text) - Optional description
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. `products`
  Cosmetics and beauty products inventory
  - `id` (uuid, primary key)
  - `sku` (text, unique) - Stock keeping unit
  - `barcode` (text, unique) - Product barcode
  - `name` (text) - Product name
  - `category_id` (uuid) - Foreign key to categories
  - `purchase_price` (decimal) - Cost price
  - `sale_price` (decimal) - Selling price
  - `tax_rate` (decimal) - Tax percentage
  - `stock_qty` (integer) - Current stock quantity
  - `low_stock_threshold` (integer) - Alert threshold
  - `image_url` (text) - Product image URL
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `services`
  Beauty services offered
  - `id` (uuid, primary key)
  - `name` (text) - Service name
  - `price` (decimal) - Service price
  - `duration` (integer) - Duration in minutes
  - `tax_rate` (decimal) - Tax percentage
  - `active` (boolean) - Service availability
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `stock_movements`
  Track all stock additions and deductions
  - `id` (uuid, primary key)
  - `product_id` (uuid) - Foreign key to products
  - `movement_type` (text) - 'purchase' or 'sale' or 'adjustment'
  - `quantity` (integer) - Quantity moved (positive for additions)
  - `purchase_price` (decimal) - Price per unit for purchases
  - `reference_id` (uuid) - Invoice ID if sale
  - `notes` (text) - Additional notes
  - `created_by` (uuid) - User who created the entry
  - `created_at` (timestamptz)

  ### 5. `invoices`
  Sales invoices and bills
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - Auto-generated invoice number
  - `customer_name` (text) - Optional customer name
  - `customer_phone` (text) - Optional customer phone
  - `subtotal` (decimal) - Total before discount and tax
  - `discount_amount` (decimal) - Discount applied
  - `discount_percentage` (decimal) - Discount percentage
  - `tax_amount` (decimal) - Total tax
  - `total_amount` (decimal) - Final payable amount
  - `payment_method` (text) - 'cash', 'card', 'upi'
  - `created_by` (uuid) - User who created invoice
  - `created_at` (timestamptz)

  ### 6. `invoice_items`
  Line items in invoices (products and services)
  - `id` (uuid, primary key)
  - `invoice_id` (uuid) - Foreign key to invoices
  - `item_type` (text) - 'product' or 'service'
  - `product_id` (uuid) - Foreign key to products (nullable)
  - `service_id` (uuid) - Foreign key to services (nullable)
  - `item_name` (text) - Snapshot of name at time of sale
  - `quantity` (integer) - Quantity sold
  - `unit_price` (decimal) - Price per unit at time of sale
  - `tax_rate` (decimal) - Tax rate at time of sale
  - `tax_amount` (decimal) - Tax amount for this item
  - `total_amount` (decimal) - Line total
  - `created_at` (timestamptz)

  ### 7. `settings`
  Application settings
  - `id` (uuid, primary key)
  - `key` (text, unique) - Setting key
  - `value` (text) - Setting value (JSON stringified)
  - `updated_at` (timestamptz)

  ### 8. `users`
  User management for audit trail
  - `id` (uuid, primary key)
  - `email` (text, unique)
  - `name` (text)
  - `role` (text) - 'admin' or 'staff'
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies allow authenticated users to perform operations
  - Audit trail maintained via created_by fields

  ## Indexes
  - Added for frequently queried columns
  - Foreign key indexes for joins
  - Unique constraints on SKU, barcode, invoice numbers
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  barcode text UNIQUE,
  name text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  purchase_price decimal(10, 2) NOT NULL DEFAULT 0,
  sale_price decimal(10, 2) NOT NULL DEFAULT 0,
  tax_rate decimal(5, 2) NOT NULL DEFAULT 0,
  stock_qty integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_qty);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10, 2) NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 30,
  tax_rate decimal(5, 2) NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to services"
  ON services FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment')),
  quantity integer NOT NULL,
  purchase_price decimal(10, 2) DEFAULT 0,
  reference_id uuid,
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to stock_movements"
  ON stock_movements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_name text DEFAULT '',
  customer_phone text DEFAULT '',
  subtotal decimal(10, 2) NOT NULL DEFAULT 0,
  discount_amount decimal(10, 2) NOT NULL DEFAULT 0,
  discount_percentage decimal(5, 2) NOT NULL DEFAULT 0,
  tax_amount decimal(10, 2) NOT NULL DEFAULT 0,
  total_amount decimal(10, 2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('product', 'service')),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10, 2) NOT NULL DEFAULT 0,
  tax_rate decimal(5, 2) NOT NULL DEFAULT 0,
  tax_amount decimal(10, 2) NOT NULL DEFAULT 0,
  total_amount decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to invoice_items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_service ON invoice_items(service_id);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to settings"
  ON settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to users"
  ON users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('default_tax_rate', '18'),
  ('invoice_prefix', 'INV'),
  ('invoice_counter', '1000'),
  ('store_name', 'Beauty Parlour'),
  ('store_address', ''),
  ('store_phone', ''),
  ('store_logo', '')
ON CONFLICT (key) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
  ('Skincare', 'Skincare products'),
  ('Haircare', 'Hair care products'),
  ('Makeup', 'Makeup and cosmetics'),
  ('Fragrances', 'Perfumes and fragrances'),
  ('Tools', 'Beauty tools and accessories')
ON CONFLICT (name) DO NOTHING;