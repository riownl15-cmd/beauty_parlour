/*
  # Create Customers Table and Update Invoices

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text) - Customer full name
      - `phone` (text, unique) - Customer phone number
      - `email` (text, nullable) - Customer email address
      - `address` (text, nullable) - Customer address
      - `notes` (text, nullable) - Additional notes about customer
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Changes to Existing Tables
    - Add `customer_id` foreign key to `invoices` table
    - Keep existing `customer_name` and `customer_phone` for backward compatibility
  
  3. Security
    - Enable RLS on `customers` table
    - Add policies for public access to allow customer management
    - These policies allow full CRUD operations for demonstration purposes
  
  4. Notes
    - Phone numbers are unique to prevent duplicate customers
    - The system will auto-populate customer details when phone is selected
    - Purchase history can be tracked through invoices linked to customer_id
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add customer_id to invoices table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN customer_id uuid REFERENCES customers(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Allow public to view customers"
  ON customers FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert customers"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update customers"
  ON customers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete customers"
  ON customers FOR DELETE
  USING (true);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
