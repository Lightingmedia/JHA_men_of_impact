/*
  # Add Admin Member

  1. New Members
    - Add primary administrator with phone number 9254343862
    - Set full admin privileges and active status
    - Use conflict resolution to prevent duplicates

  2. Security
    - Admin can manage all members through existing RLS policies
*/

-- Insert the admin member with the exact phone number format
INSERT INTO members (phone, full_name, is_admin, is_active)
VALUES ('9254343862', 'Administrator', true, true)
ON CONFLICT (phone) DO UPDATE SET
  is_admin = true,
  is_active = true,
  updated_at = now();