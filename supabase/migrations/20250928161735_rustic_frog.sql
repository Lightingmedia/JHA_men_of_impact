/*
  # Activate All Members and Add Phone Normalization

  1. Database Changes
    - Activate all members (set is_active = true)
    - Add normalized_phone column for better matching
    - Add phone normalization function
    - Add indexes for fast phone lookups

  2. Security
    - No RLS changes needed
    - Maintains existing permissions
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create phone normalization function
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove all non-digit characters and return
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add normalized_phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'normalized_phone'
  ) THEN
    ALTER TABLE members ADD COLUMN normalized_phone TEXT;
  END IF;
END $$;

-- Update all members to be active
UPDATE members SET is_active = true WHERE is_active = false OR is_active IS NULL;

-- Populate normalized_phone for existing records
UPDATE members 
SET normalized_phone = normalize_phone(phone) 
WHERE normalized_phone IS NULL OR normalized_phone = '';

-- Create trigger function to auto-update normalized_phone
CREATE OR REPLACE FUNCTION update_normalized_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_phone = normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_normalized_phone ON members;

-- Create trigger for auto-updating normalized_phone
CREATE TRIGGER trigger_update_normalized_phone
  BEFORE INSERT OR UPDATE OF phone ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_normalized_phone();

-- Create indexes for fast phone lookups
CREATE INDEX IF NOT EXISTS idx_members_phone_normalized ON members(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_members_phone_gin ON members USING gin(phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_members_phone_search ON members(phone);

-- Create index for active members
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active) WHERE is_active = true;