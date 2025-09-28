/*
  # Fix Phone Number Matching and Activate All Members

  1. Database Updates
    - Activate all members (set is_active = true)
    - Add phone normalization function
    - Add search indexes for better performance

  2. Security
    - No RLS changes needed
    - Maintains existing permissions
*/

-- Activate all members in the database
UPDATE members SET is_active = true WHERE is_active = false;

-- Create phone normalization function
CREATE OR REPLACE FUNCTION normalize_phone(phone_input text)
RETURNS text AS $$
BEGIN
  -- Remove all non-digit characters
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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

-- Update normalized phone numbers for all existing members
UPDATE members 
SET phone_normalized = normalize_phone(phone) 
WHERE phone_normalized IS NULL OR phone_normalized = '';

-- Create trigger function to auto-update normalized phone
CREATE OR REPLACE FUNCTION update_phone_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone_normalized = normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_phone_normalized ON members;

-- Create trigger for auto-updating normalized phone
CREATE TRIGGER trigger_update_phone_normalized
  BEFORE INSERT OR UPDATE OF phone ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_normalized();

-- Add indexes for better phone number searching
CREATE INDEX IF NOT EXISTS idx_members_phone_normalized ON members(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_members_phone_search ON members USING gin(phone gin_trgm_ops);

-- Ensure trigram extension is available for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;