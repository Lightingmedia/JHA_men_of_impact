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
      // Check if this is the super admin number
      if (phone === '9254343862') {
        // Create or get admin user
        const { data: existingAdmin, error: checkError } = await supabase
          .from('members')
          .select('*')
          .eq('phone', '9254343862')
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Database check error:', checkError);
          return {
            success: false,
            error: 'Database connection error. Please check your Supabase configuration.'
          };
        }

        let adminUser = existingAdmin;
        
        if (!adminUser) {
          // Create initial admin user
          const { data: newAdmin, error: createError } = await supabase
            .from('members')
            .insert([{
              phone: '9254343862',
              full_name: 'JHA Admin',
              is_admin: true,
              is_active: true
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating admin user:', createError);
            return {
              success: false,
              error: 'Could not create admin user. Please check database permissions.'
            };
          }
          
          adminUser = newAdmin;
        }

        localStorage.setItem('jha_member_id', adminUser.id);
        setUser(adminUser);
        return { success: true };
      }

      // Check if the phone number is in our approved members list
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError) {
        console.error('Database error:', memberError);
        return {
          success: false,
          error: 'Database connection error. Please try again.'
        };
      }

      if (!member) {
        return {
          success: false,
          error: 'Phone number not found. Please contact an administrator or try: 9254343862 for admin access.'
        };
      }

      localStorage.setItem('jha_member_id', member.id);
      setUser(member);
      
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Please try again'}`
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