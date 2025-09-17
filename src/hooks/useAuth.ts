import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, Member } from '../lib/supabase';

interface AuthContextType {
  user: Member | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithPhone = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const cleanPhone = phoneNumber.trim();
      console.log('🔐 Attempting to sign in with phone:', cleanPhone);
      
      // Check if user exists in members table
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('phone', cleanPhone)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Database error:', error, 'for phone:', cleanPhone);
        if (error.code === 'PGRST116') {
          return { 
            success: false, 
            error: `Phone number "${cleanPhone}" not found. Please contact admin to add your number.` 
          };
        }
        return { 
          success: false, 
          error: 'Connection error. Please try again.' 
        };
      }

      if (!member) {
        return { 
          success: false, 
          error: 'Phone number not found. Please check your number.' 
        };
      }

      console.log('✅ User found:', member.full_name);
      setUser(member);
      
      // Store user session in localStorage
      localStorage.setItem('jha-user', JSON.stringify(member));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setUser(null);
      localStorage.removeItem('jha-user');
      console.log('✅ User signed out');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Check for stored user session
      const storedUser = localStorage.getItem('jha-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // Verify user still exists and is active
        const { data: member, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', userData.id)
          .eq('is_active', true)
          .single();

        if (!error && member) {
          setUser(member);
          // Update stored user data
          localStorage.setItem('jha-user', JSON.stringify(member));
        } else {
          // User no longer exists or is inactive
          localStorage.removeItem('jha-user');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('❌ Refresh user error:', error);
      localStorage.removeItem('jha-user');
      setUser(null);
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
  };
};