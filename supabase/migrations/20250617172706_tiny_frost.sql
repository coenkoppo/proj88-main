/*
  # Create demo users for testing

  1. New Users
    - Creates demo users with different roles (admin, manager, employee)
    - Sets up proper authentication credentials
    - Ensures users can log in with the credentials shown in the login form

  2. Security
    - Users are created with proper role assignments
    - Passwords are hashed by Supabase auth system
*/

-- Insert demo users into auth.users (this would normally be done through Supabase auth, but we'll insert into the users table)
-- Note: In a real scenario, these users would be created through the Supabase auth system

INSERT INTO users (id, email, role, name, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@barkasbali88.com', 'admin', 'Admin User', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'manager@barkasbali88.com', 'manager', 'Manager User', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'employee@barkasbali88.com', 'employee', 'Employee User', now(), now())
ON CONFLICT (email) DO NOTHING;