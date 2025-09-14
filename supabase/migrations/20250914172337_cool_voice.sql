/*
  # Allow Initial Admin Creation

  1. Security Policy Updates
    - Add policy to allow creation of first admin user
    - Ensures only one admin can be created via anonymous access
    - Maintains security after initial setup

  2. Changes
    - Creates policy for anonymous users to insert first admin
    - Policy automatically disables after first admin is created
    - Existing admin policies remain unchanged
*/

-- Create policy to allow initial admin creation
CREATE POLICY "Allow initial admin creation"
  ON members
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Only allow if no admin exists yet AND the new user is being created as admin
    NOT EXISTS (SELECT 1 FROM members WHERE is_admin = TRUE)
    AND is_admin = TRUE
  );

-- Also allow authenticated users to create the first admin if none exists
CREATE POLICY "Allow authenticated initial admin creation"
  ON members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if no admin exists yet, regardless of admin status of new user
    NOT EXISTS (SELECT 1 FROM members WHERE is_admin = TRUE)
    OR 
    -- Or if an admin already exists and current user is admin (existing policy logic)
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND is_admin = TRUE
    )
  );