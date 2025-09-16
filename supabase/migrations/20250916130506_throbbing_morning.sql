/*
  # Update Administrator Phone Number

  1. Changes
    - Update administrator phone number from formatted to plain format
    - Ensure admin user exists with correct phone number format

  2. Security
    - Uses UPSERT pattern to safely update or insert admin user
    - Maintains admin privileges and active status
*/

-- Update or insert the administrator user with the correct phone format
INSERT INTO members (
  phone,
  full_name,
  is_admin,
  is_active
) VALUES (
  '9254343862',
  'Administrator',
  true,
  true
) ON CONFLICT (phone) DO UPDATE SET
  is_admin = EXCLUDED.is_admin,
  is_active = EXCLUDED.is_active;

-- Also update any existing record with the old formatted phone number
UPDATE members 
SET phone = '9254343862'
WHERE phone = '+1 (925) 434-3862';