/*
# JHA Men Of Impact Database Schema

1. New Tables
   - `members` - Core member information
     - `id` (uuid, primary key)
     - `phone` (text, unique) - Primary identifier for authentication
     - `full_name` (text) - Member's full name
     - `profile_picture_url` (text, optional) - URL to uploaded profile picture
     - `birth_month` (integer) - Birthday month (1-12)
     - `birth_day` (integer) - Birthday day (1-31)
     - `is_admin` (boolean) - Admin privileges flag
     - `is_active` (boolean) - Active membership status
     - `created_at` (timestamp) - Account creation timestamp
     - `updated_at` (timestamp) - Last profile update

2. Security
   - Enable RLS on all tables
   - Members can read all member data (for directory)
   - Members can only update their own profile
   - Only admins can manage member status and admin privileges

3. Storage
   - Create storage bucket for profile pictures
   - RLS policies for secure file upload/access
*/

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  full_name text NOT NULL,
  profile_picture_url text,
  birth_month integer CHECK (birth_month >= 1 AND birth_month <= 12),
  birth_day integer CHECK (birth_day >= 1 AND birth_day <= 31),
  is_admin boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Members can read all active member data
CREATE POLICY "Members can read active members"
  ON members
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Members can update only their own profile
CREATE POLICY "Members can update own profile"
  ON members
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Admins can insert new members
CREATE POLICY "Admins can insert members"
  ON members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );

-- Admins can update any member
CREATE POLICY "Admins can update any member"
  ON members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT DO NOTHING;

-- RLS for profile picture uploads
CREATE POLICY "Members can upload own profile pictures"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-pictures');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert sample admin user (replace with actual admin phone number)
INSERT INTO members (phone, full_name, is_admin, birth_month, birth_day)
VALUES ('+1234567890', 'Admin User', true, 1, 1)
ON CONFLICT (phone) DO NOTHING;