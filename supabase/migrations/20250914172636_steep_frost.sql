/*
# Remove All RLS Restrictions

This migration removes all Row Level Security restrictions from the members table
to allow unrestricted access for development and testing.

## Changes:
1. Drop all existing RLS policies
2. Disable RLS on members table
3. Allow full access to all operations

## Security Note:
This removes all security restrictions. In production, you may want to re-enable
appropriate RLS policies based on your security requirements.
*/

-- Drop all existing policies on members table
DROP POLICY IF EXISTS "Admins can insert members" ON members;
DROP POLICY IF EXISTS "Admins can update any member" ON members;
DROP POLICY IF EXISTS "Allow authenticated initial admin creation" ON members;
DROP POLICY IF EXISTS "Allow initial admin creation" ON members;
DROP POLICY IF EXISTS "Members can read active members" ON members;
DROP POLICY IF EXISTS "Members can update own profile" ON members;

-- Disable Row Level Security on members table
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated and anonymous users
GRANT ALL ON members TO authenticated;
GRANT ALL ON members TO anon;