/*
  # Simple Member Activation and Phone Normalization

  1. Database Changes
    - Activate all members
    - Add normalized phone column
    - Create search indexes
    - No triggers (avoiding syntax issues)

  2. Security
    - No RLS changes needed
    - Simple column additions only
*/

-- Activate all members first
UPDATE members SET is_active = true WHERE is_active = false OR is_active IS NULL;

-- Add normalized phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'phone_normalized'
  ) THEN
    ALTER TABLE members ADD COLUMN phone_normalized text;
  END IF;
END $$;

-- Update normalized phone numbers (remove all non-digits)
UPDATE members 
SET phone_normalized = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone_normalized IS NULL OR phone_normalized = '';

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS members_phone_normalized_idx ON members(phone_normalized);
CREATE INDEX IF NOT EXISTS members_phone_search_idx ON members USING gin(phone gin_trgm_ops);

-- Enable trigram extension for fuzzy search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;