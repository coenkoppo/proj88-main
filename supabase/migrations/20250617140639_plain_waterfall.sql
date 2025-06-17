/*
  # Initial Database Schema for BarkasBali88

  1. New Tables
    - `users` - User management with roles
    - `products` - Product catalog with stock management
    - `customers` - Customer information
    - `orders` - Order management with payment tracking
    - `order_items` - Individual items in orders
    - `price_history` - Negotiated prices per customer
    - `activity_logs` - User activity tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure customer and order data

  3. Features
    - Multi-role user system (admin, manager, employee)
    - Product management with tags and stock tracking
    - Order management with flexible payment options
    - Customer price history for negotiations
    - Activity logging for audit trail
*/

-- Create users table for role management
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(12,2) NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  category text DEFAULT '',
  stock integer NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  is_limited_stock boolean DEFAULT false,
  barcode text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text DEFAULT '',
  subtotal decimal(12,2) NOT NULL DEFAULT 0,
  discount decimal(12,2) NOT NULL DEFAULT 0,
  shipping_cost decimal(12,2) NOT NULL DEFAULT 0,
  total decimal(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('dp', 'cod', 'cash', 'transfer')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'dp_paid', 'paid')),
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes text DEFAULT '',
  voucher_code text DEFAULT '',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price decimal(12,2) NOT NULL DEFAULT 0,
  total decimal(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create price_history table for customer negotiations
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  product_id uuid REFERENCES products(id),
  negotiated_price decimal(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for products table
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'employee')
    )
  );

-- Create policies for customers table
CREATE POLICY "Authenticated users can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'employee')
    )
  );

-- Create policies for orders table
CREATE POLICY "Authenticated users can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'employee')
    )
  );

-- Create policies for order_items table
CREATE POLICY "Authenticated users can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'employee')
    )
  );

-- Create policies for price_history table
CREATE POLICY "Authenticated users can manage price history"
  ON price_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'employee')
    )
  );

-- Create policies for activity_logs table
CREATE POLICY "Users can read own activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins and managers can read all activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Authenticated users can create activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Insert sample data
INSERT INTO users (id, email, role, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@barkasball88.com', 'admin', 'Administrator'),
  ('22222222-2222-2222-2222-222222222222', 'manager@barkasball88.com', 'manager', 'Manager'),
  ('33333333-3333-3333-3333-333333333333', 'employee@barkasball88.com', 'employee', 'Employee')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, image_url, category, stock, tags, is_featured, is_limited_stock) VALUES
  ('Laptop Gaming ROG', 'Laptop gaming high-end dengan performa maksimal', 15000000, 'https://images.pexels.com/photos/18105/pexels-photo.jpg', 'Electronics', 5, '{"gaming", "laptop", "rog"}', true, true),
  ('Smartphone Android', 'Smartphone Android terbaru dengan kamera canggih', 8000000, 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg', 'Electronics', 15, '{"smartphone", "android", "camera"}', true, false),
  ('Headset Wireless', 'Headset wireless dengan noise cancelling', 2500000, 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg', 'Audio', 20, '{"headset", "wireless", "audio"}', true, false),
  ('Keyboard Mechanical', 'Keyboard mechanical RGB untuk gaming', 1500000, 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg', 'Accessories', 12, '{"keyboard", "mechanical", "gaming"}', false, false),
  ('Mouse Gaming', 'Mouse gaming dengan DPI tinggi', 800000, 'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg', 'Accessories', 25, '{"mouse", "gaming", "dpi"}', false, false),
  ('Monitor 4K', 'Monitor 4K 27 inch untuk profesional', 6000000, 'https://images.pexels.com/photos/777001/pexels-photo-777001.jpeg', 'Electronics', 8, '{"monitor", "4k", "professional"}', true, true)
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO customers (name, phone, email, address) VALUES
  ('Budi Santoso', '081234567890', 'budi@email.com', 'Jl. Merdeka No. 123, Denpasar'),
  ('Siti Nurhaliza', '081234567891', 'siti@email.com', 'Jl. Sudirman No. 456, Ubud'),
  ('Ahmad Rahman', '081234567892', 'ahmad@email.com', 'Jl. Gajah Mada No. 789, Sanur')
ON CONFLICT DO NOTHING;