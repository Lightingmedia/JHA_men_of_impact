/*
# Activate All Members for Unrestricted Login

This migration ensures all members in the database can login without restrictions.

1. Database Updates
   - Set all members to active status
   - Remove any login restrictions
   - Ensure phone numbers are properly indexed

2. Security
   - Maintain existing RLS policies
   - Keep admin privileges intact
*/

-- Activate all members in the database
UPDATE members 
SET is_active = true 
WHERE is_active = false OR is_active IS NULL;

-- Ensure phone numbers are properly indexed for fast lookups
CREATE INDEX IF NOT EXISTS members_phone_search_idx ON members USING gin(to_tsvector('english', phone));

-- Add a function to normalize phone numbers for better matching
CREATE OR REPLACE FUNCTION normalize_phone(phone_input text)
RETURNS text AS $$
BEGIN
  -- Remove all non-digit characters
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create an index on normalized phone numbers for faster searching
CREATE INDEX IF NOT EXISTS members_phone_normalized_idx ON members (normalize_phone(phone));

-- Update statistics
ANALYZE members;