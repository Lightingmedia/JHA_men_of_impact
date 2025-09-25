/*
  # Create Super Admin System

  1. New Tables
    - Add `is_super_admin` column to members table
    - Set 9254343862 as super admin
  
  2. Security
    - Only super admins can modify admin status
    - Super admin status cannot be changed by regular admins
  
  3. Features
    - Super admin can promote/demote regular admins
    - View-only admin management interface
*/

-- Add super admin column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE members ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- Set 9254343862 as super admin
UPDATE members 
SET is_super_admin = true, is_admin = true, is_active = true
WHERE phone LIKE '%9254343862%' OR phone LIKE '%925%434%3862%';

-- Also try exact matches for different formats
UPDATE members 
SET is_super_admin = true, is_admin = true, is_active = true
WHERE phone IN (
  '9254343862',
  '(925) 434-3862',
  '+1 (925) 434-3862',
  '925-434-3862',
  '925.434.3862',
  '925 434 3862',
  '+19254343862'
);

-- Create index for super admin queries
CREATE INDEX IF NOT EXISTS members_super_admin_idx ON members(is_super_admin) WHERE is_super_admin = true;

-- Add RLS policy for super admin operations
CREATE POLICY "Super admins can manage admin status"
  ON members
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow super admins to update admin status of others (but not super admin status)
    EXISTS (
      SELECT 1 FROM members 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  )
  WITH CHECK (
    -- Prevent changing super admin status
    (OLD.is_super_admin = NEW.is_super_admin) AND
    -- Allow super admins to change admin status
    EXISTS (
      SELECT 1 FROM members 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );