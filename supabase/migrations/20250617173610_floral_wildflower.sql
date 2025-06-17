/*
  # Fix RLS Policy Infinite Recursion

  1. Problem
    - Infinite recursion detected in policy for relation "users"
    - Complex policies causing circular dependencies
    - Queries failing with 500 errors

  2. Solution
    - Simplify RLS policies to avoid recursion
    - Use auth.uid() directly instead of complex subqueries
    - Remove circular references in policy definitions

  3. Changes
    - Update users table policies to be more direct
    - Simplify product access policies
    - Fix activity logs policies
    - Ensure no circular dependencies
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can manage order items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can manage price history" ON price_history;
DROP POLICY IF EXISTS "Admins and managers can read all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Authenticated users can create activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can read own activity logs" ON activity_logs;

-- Create simplified users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a function to check user role safely
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM users WHERE id = user_id;
$$;

-- Create simplified product policies
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
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  )
  WITH CHECK (
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  );

-- Create simplified customer policies
CREATE POLICY "Authenticated users can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  )
  WITH CHECK (
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  );

-- Create simplified order policies
CREATE POLICY "Authenticated users can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  )
  WITH CHECK (
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  );

-- Create simplified order items policies
CREATE POLICY "Authenticated users can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  )
  WITH CHECK (
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  );

-- Create simplified price history policies
CREATE POLICY "Authenticated users can manage price history"
  ON price_history
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  )
  WITH CHECK (
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager', 'employee') THEN true
      ELSE false
    END
  );

-- Create simplified activity logs policies
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
    CASE 
      WHEN get_user_role(auth.uid()) IN ('admin', 'manager') THEN true
      ELSE false
    END
  );

CREATE POLICY "Authenticated users can create activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;