import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, Member } from '../lib/supabase';

interface AuthContextType {
  user: Member | null;
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithPhone = async (phone: string) => {
    try {
      // Admin bypass for development/testing
      if (phone === '9254343862' || phone === '(925) 434-3862' || phone === '+1 (925) 434-3862') {
        const adminUser: Member = {
          id: 'admin-bypass-id',
          phone: phone,
          full_name: 'Administrator',
          profile_picture_url: undefined,
          birth_month: undefined,
          birth_day: undefined,
          is_admin: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('jha_member_id', adminUser.id);
        localStorage.setItem('jha_admin_user', JSON.stringify(adminUser));
        setUser(adminUser);
        
        return { success: true };
      }

      // First check if the phone number is in our approved members list
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError || !member) {
        return {
          success: false,
          error: 'Phone number not found in approved members list. Please contact an administrator.'
        };
      }

      // For now, we'll use a simple auth system
      // In production, you'd want to implement proper phone verification
      localStorage.setItem('jha_member_id', member.id);
      setUser(member);
      
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: 'An error occurred during sign in. Please try again.'
      };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('jha_member_id');
    setUser(null);
  };

  const refreshUser = async () => {
    const memberId = localStorage.getItem('jha_member_id');
    if (!memberId) {
      setLoading(false);
      return;
    }

    // Check for admin bypass user
    if (memberId === 'admin-bypass-id') {
      const adminUser = localStorage.getItem('jha_admin_user');
      if (adminUser) {
        setUser(JSON.parse(adminUser));
      }
      setLoading(false);
      return;
    }

    try {
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .eq('is_active', true)
        .maybeSingle();

      if (member) {
        setUser(member);
      } else {
        localStorage.removeItem('jha_member_id');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      localStorage.removeItem('jha_member_id');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return {
    user,
    loading,
    signInWithPhone,
    signOut,
    refreshUser,
    AuthContext
  };
};