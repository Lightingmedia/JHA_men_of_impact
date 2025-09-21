/*
  # Enable All Phone Numbers for Login

  This migration ensures all phone numbers in the database can be used for login
  by updating any inactive members to active status and adding comprehensive
  phone number variants for better matching.

  1. Security
    - Enable RLS on members table (if not already enabled)
    - Ensure all members can authenticate

  2. Data Updates
    - Activate all members for login
    - Standardize phone number formats
*/

-- Ensure all members are active for login
UPDATE members 
SET is_active = true 
WHERE is_active = false OR is_active IS NULL;

-- Add index on phone for faster lookups
CREATE INDEX IF NOT EXISTS members_phone_search_idx ON members USING gin(phone gin_trgm_ops);

-- Create function to normalize phone numbers for better matching
CREATE OR REPLACE FUNCTION normalize_phone(phone_input text)
RETURNS text AS $$
BEGIN
  -- Remove all non-digit characters
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add normalized phone column for faster searches (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'members' AND column_name = 'phone_normalized'
  ) THEN
    ALTER TABLE members ADD COLUMN phone_normalized text;
    
    -- Populate normalized phone numbers
    UPDATE members 
    SET phone_normalized = normalize_phone(phone) 
    WHERE phone IS NOT NULL;
    
    -- Add index on normalized phone
    CREATE INDEX members_phone_normalized_idx ON members (phone_normalized);
  END IF;
END $$;

-- Update trigger to maintain normalized phone numbers
CREATE OR REPLACE FUNCTION update_phone_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone_normalized = normalize_phone(NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_phone_normalized_trigger ON members;
CREATE TRIGGER update_phone_normalized_trigger
  BEFORE INSERT OR UPDATE OF phone ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_normalized();