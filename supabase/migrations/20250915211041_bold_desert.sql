/*
  # Fix Meeting Rooms Table

  1. Tables
    - Ensure `meeting_rooms` table exists with proper structure
    - Add proper indexes and constraints
  
  2. Security
    - Enable RLS on `meeting_rooms` table
    - Add policies for authenticated users to create and read meetings
*/

-- Create meeting_rooms table if it doesn't exist
CREATE TABLE IF NOT EXISTS meeting_rooms (
  id text PRIMARY KEY,
  created_by uuid REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  participants text[] DEFAULT '{}'::text[]
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS meeting_rooms_created_by_idx ON meeting_rooms(created_by);
CREATE INDEX IF NOT EXISTS meeting_rooms_is_active_idx ON meeting_rooms(is_active);

-- Enable RLS
ALTER TABLE meeting_rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create meeting rooms" ON meeting_rooms;
DROP POLICY IF EXISTS "Users can read meeting rooms" ON meeting_rooms;
DROP POLICY IF EXISTS "Meeting creators can update their rooms" ON meeting_rooms;

-- Create policies for meeting rooms
CREATE POLICY "Users can create meeting rooms"
  ON meeting_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read meeting rooms"
  ON meeting_rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Meeting creators can update their rooms"
  ON meeting_rooms
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());