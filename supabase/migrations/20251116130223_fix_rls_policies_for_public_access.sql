/*
  # Fix RLS Policies for Public Access

  ## Overview
  Update all RLS policies to allow public (unauthenticated) access for the business app.
  This is appropriate since the app runs locally/behind firewall without auth system.

  ## Changes
  - Enable public SELECT, INSERT, UPDATE, DELETE on all tables
  - Keep RLS enabled for security framework
  - Allow all operations for the business application
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users full access to categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users full access to services" ON services;
DROP POLICY IF EXISTS "Allow authenticated users full access to stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "Allow authenticated users full access to invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated users full access to invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "Allow authenticated users full access to settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users full access to users" ON users;

-- Categories policies
CREATE POLICY "Allow all access to categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts to categories"
  ON categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates to categories"
  ON categories FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes to categories"
  ON categories FOR DELETE
  USING (true);

-- Products policies
CREATE POLICY "Allow all access to products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts to products"
  ON products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates to products"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes to products"
  ON products FOR DELETE
  USING (true);

-- Services policies
CREATE POLICY "Allow all access to services"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts to services"
  ON services FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates to services"
  ON services FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes to services"
  ON services FOR DELETE
  USING (true);

-- Stock movements policies
CREATE POLICY "Allow all access to stock_movements"
  ON stock_movements FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts to stock_movements"
  ON stock_movements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates to stock_movements"
  ON stock_movements FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes to stock_movements"
  ON stock_movements FOR DELETE
  USING (true);

-- Invoices policies
CREATE POLICY "Allow all access to invoices"
  ON invoices FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts to invoices"
  ON invoices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates to invoices"
  ON invoices FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes to invoices"
  ON invoices FOR DELETE
  USING (true);

-- Invoice items policies
CREATE POLICY "Allow all access to invoice_items"
  ON invoice_items FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts to invoice_items"
  ON invoice_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates to invoice_items"
  ON invoice_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes to invoice_items"
  ON invoice_items FOR DELETE
  USING (true);

-- Settings policies
CREATE POLICY "Allow all access to settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts to settings"
  ON settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates to settings"
  ON settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes to settings"
  ON settings FOR DELETE
  USING (true);

-- Users policies
CREATE POLICY "Allow all access to users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts to users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates to users"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all deletes to users"
  ON users FOR DELETE
  USING (true);