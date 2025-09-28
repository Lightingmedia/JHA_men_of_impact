/*
  # Fix Member Activation

  1. Database Updates
    - Activate all members in the system
    - Add phone search optimization
    - Ensure all members can login

  2. Security
    - No complex triggers or functions
    - Simple, reliable SQL operations
*/

-- Activate all members
UPDATE members SET is_active = true WHERE is_active = false OR is_active IS NULL;

-- Add index for phone number searches if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'members' 
        AND indexname = 'members_phone_search_idx'
    ) THEN
        CREATE INDEX members_phone_search_idx ON members USING btree (phone);
    END IF;
END $$;

-- Add text search index if pg_trgm extension is available
DO $$
BEGIN
    -- Try to create extension if it doesn't exist
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    
    -- Create trigram index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'members' 
        AND indexname = 'members_phone_trgm_idx'
    ) THEN
        CREATE INDEX members_phone_trgm_idx ON members USING gin (phone gin_trgm_ops);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Silently ignore if pg_trgm is not available
        NULL;
END $$;