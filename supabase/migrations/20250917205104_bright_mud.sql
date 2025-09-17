/*
# Add Admin User

1. New User
  - Add admin user with phone number 9254343862
  - Set as administrator with full privileges
  - Mark as active user

2. Security
  - Enable RLS on members table (already enabled)
  - User will have admin access to all features
*/

-- Insert admin user if not exists
INSERT INTO members (phone, full_name, is_admin, is_active)
VALUES ('9254343862', 'Admin User', true, true)
ON CONFLICT (phone) DO UPDATE SET
  is_admin = true,
  is_active = true,
  updated_at = now();

-- Also add the formatted version
INSERT INTO members (phone, full_name, is_admin, is_active)
VALUES ('+1 (925) 434-3862', 'Admin User Alt', true, true)
ON CONFLICT (phone) DO UPDATE SET
  is_admin = true,
  is_active = true,
  updated_at = now();