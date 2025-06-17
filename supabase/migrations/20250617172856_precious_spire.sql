/*
  # Update demo users with correct email domains
  
  This migration updates the existing demo users to have the correct email domains
  and ensures they have the proper roles and names.
*/

-- Update existing demo users with correct email domains
UPDATE users 
SET 
  email = 'admin@barkasbali88.com',
  name = 'Admin User',
  updated_at = now()
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE users 
SET 
  email = 'manager@barkasbali88.com',
  name = 'Manager User',
  updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE users 
SET 
  email = 'employee@barkasbali88.com',
  name = 'Employee User',
  updated_at = now()
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Insert any missing demo users (in case some don't exist)
INSERT INTO users (id, email, role, name, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@barkasbali88.com', 'admin', 'Admin User', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'manager@barkasbali88.com', 'manager', 'Manager User', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'employee@barkasbali88.com', 'employee', 'Employee User', now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = now();