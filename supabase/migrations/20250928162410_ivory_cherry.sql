/*
  # Simple Member Activation

  Just activate all members - no complex triggers or functions
*/

-- Simply activate all members
UPDATE members SET is_active = true WHERE is_active = false OR is_active IS NULL;

-- Add index for phone searches if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'members' AND indexname = 'members_phone_search_idx'
  ) THEN
    CREATE INDEX members_phone_search_idx ON members USING gin(phone gin_trgm_ops);
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- pg_trgm extension not available, create regular index instead
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'members' AND indexname = 'members_phone_simple_idx'
    ) THEN
      CREATE INDEX members_phone_simple_idx ON members(phone);
    END IF;
END $$;