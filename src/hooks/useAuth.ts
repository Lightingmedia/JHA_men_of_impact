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
      const inputPhone = phoneNumber.trim();
      console.log('🔐 Attempting to sign in with phone:', inputPhone);
      
      // Get ALL members from database (no restrictions)
      const { data: allMembers, error: fetchError } = await supabase
        .from('members')
        .select('*')
        .order('full_name');

      if (fetchError) {
        console.error('❌ Database fetch error:', fetchError);
        return { success: false, error: 'Database connection error. Please try again.' };
      }

      if (!allMembers || allMembers.length === 0) {
        console.error('❌ No active members found in database');
        return { success: false, error: 'No active members found. Please contact admin.' };
      }

      console.log('📱 Available members:', allMembers.length);
      console.log('📱 Total members in database:', allMembers.length);

      // Stricter phone number matching
      const inputDigits = inputPhone.replace(/\D/g, '');
      console.log('🔍 Input digits for matching:', inputDigits);

      const foundMember = allMembers.find(member => {
        const memberDigits = member.phone.replace(/\D/g, '');
        return memberDigits === inputDigits;
      });

      if (!foundMember) {
        console.error('❌ No matching member found for input:', inputPhone);
        console.log('📋 Total members checked:', allMembers.length);
        
        return { 
          success: false, 
          error: `Phone number not found in database. Please check your number and try again, or contact an administrator.` 
        };
      }

      console.log('✅ Login successful for:', foundMember.full_name);
      setUser(foundMember);
      
      // Store user session in localStorage
      localStorage.setItem('jha-user', JSON.stringify(foundMember));
      
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