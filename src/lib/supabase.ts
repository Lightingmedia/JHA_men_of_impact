import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Member = {
  id: string;
  phone: string;
  full_name: string;
  profile_picture_url?: string;
  birth_month?: number;
  birth_day?: number;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};