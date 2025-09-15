/*
# Create Meeting Rooms Table

This migration creates a table to store meeting room information for video calls.

## New Tables
- `meeting_rooms`
  - `id` (text, primary key) - Unique meeting identifier
  - `created_by` (uuid) - User who created the meeting
  - `created_at` (timestamp) - When the meeting was created
  - `is_active` (boolean) - Whether the meeting is currently active
  - `participants` (text array) - List of participant IDs

## Security
- Enable RLS on `meeting_rooms` table
- Add policies for creating and reading meeting rooms
*/

CREATE TABLE IF NOT EXISTS meeting_rooms (
  id text PRIMARY KEY,
  created_by uuid REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  participants text[] DEFAULT '{}'
);

ALTER TABLE meeting_rooms ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to create meeting rooms
CREATE POLICY "Users can create meeting rooms"
  ON meeting_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy to allow users to read meeting rooms
CREATE POLICY "Users can read meeting rooms"
  ON meeting_rooms
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow meeting creators to update their rooms
CREATE POLICY "Meeting creators can update their rooms"
  ON meeting_rooms
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS meeting_rooms_created_by_idx ON meeting_rooms(created_by);
CREATE INDEX IF NOT EXISTS meeting_rooms_is_active_idx ON meeting_rooms(is_active);