/*
  # Add Admin Member

  1. New Data
    - Insert admin member with phone number (925) 434-3862
    - Grant full administrative privileges
    - Set as active member

  2. Admin Privileges
    - Can add, edit, and delete members
    - Can manage member status (active/inactive)
    - Can grant/revoke admin privileges to other members
*/

-- Insert the admin member
INSERT INTO members (
  phone,
  full_name,
  is_admin,
  is_active
) VALUES (
  '+19254343862',
  'Administrator',
  true,
  true
) ON CONFLICT (phone) DO UPDATE SET
  is_admin = true,
  is_active = true;