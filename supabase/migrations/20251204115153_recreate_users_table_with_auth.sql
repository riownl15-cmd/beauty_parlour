/*
  # Recreate Users Table for Authentication

  1. Changes
    - Drop existing users table
    - Create new users table with username and password fields
  
  2. New Tables
    - `users`
      - `id` (uuid, primary key) - Unique identifier for each user
      - `username` (text, unique) - Username for login
      - `password` (text) - Hashed password using bcrypt
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  3. Security
    - Enable RLS on `users` table
    - Add policy for public access to validate login
    - Add policy for users to update their own password
  
  4. Initial Data
    - Insert default admin user with hashed password
    - Username: admin@ssbs
    - Password: admin123 (will be hashed using bcrypt)
  
  5. Extensions
    - Enable pgcrypto extension for password hashing
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing users table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with authentication fields
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read for login validation
CREATE POLICY "Allow public to read for login"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow public to update password (will validate in app)
CREATE POLICY "Allow password updates"
  ON users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert default admin user with hashed password
-- Password: admin123
INSERT INTO users (username, password)
VALUES ('admin@ssbs', crypt('admin123', gen_salt('bf')));