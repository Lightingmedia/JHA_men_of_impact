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
      const inputPhone = phoneNumber.trim().replace(/\D/g, ''); // Remove all non-digits
      console.log('🔐 Attempting to sign in with phone (digits only):', inputPhone);
      
      // Try multiple phone number formats to match any number in database
      const phoneVariants = [
        inputPhone, // Just digits: 9254343862
        `+1${inputPhone}`, // With country code: +19254343862
        `(${inputPhone.slice(0,3)}) ${inputPhone.slice(3,6)}-${inputPhone.slice(6)}`, // Formatted: (925) 434-3862
        `+1 (${inputPhone.slice(0,3)}) ${inputPhone.slice(3,6)}-${inputPhone.slice(6)}`, // Full format: +1 (925) 434-3862
        `${inputPhone.slice(0,3)}-${inputPhone.slice(3,6)}-${inputPhone.slice(6)}`, // Dashed: 925-434-3862
        `${inputPhone.slice(0,3)}.${inputPhone.slice(3,6)}.${inputPhone.slice(6)}`, // Dotted: 925.434.3862
        `${inputPhone.slice(0,3)} ${inputPhone.slice(3,6)} ${inputPhone.slice(6)}`, // Spaced: 925 434 3862
      ];

      console.log('🔍 Trying phone variants:', phoneVariants);

      // Try exact matches first
      let member = null;
      let error = null;

      for (const variant of phoneVariants) {
        const { data, error: queryError } = await supabase
          .from('members')
          .select('*')
          .eq('phone', variant)
          .eq('is_active', true)
          .single();

        if (data && !queryError) {
          member = data;
          console.log('✅ Found exact match with variant:', variant);
          break;
        }
      }

      // If no exact match, try fuzzy search on all active members
      if (!member) {
        console.log('🔍 No exact match, trying fuzzy search...');
        const { data: allMembers, error: allError } = await supabase
          .from('members')
          .select('*')
          .eq('is_active', true);

        if (allMembers && !allError) {
          // Find member by matching digits only
          member = allMembers.find(m => {
            const memberDigits = m.phone.replace(/\D/g, '');
            return memberDigits === inputPhone || 
                   memberDigits.endsWith(inputPhone) || 
                   inputPhone.endsWith(memberDigits);
          });

          if (member) {
            console.log('✅ Found fuzzy match:', member.phone, 'for input:', inputPhone);
          }
        }
      }

      // Final check with LIKE search for partial matches
      if (!member) {
        console.log('🔍 Trying LIKE search for partial matches...');
        const { data: likeResults, error: likeError } = await supabase
          .from('members')
          .select('*')
          .like('phone', `%${inputPhone}%`)
          .eq('is_active', true);

        if (likeResults && likeResults.length > 0 && !likeError) {
          member = likeResults[0]; // Take first match
          console.log('✅ Found LIKE match:', member.phone);
        }
      }

      if (!member) {
        console.error('❌ No user found for phone:', inputPhone);
        
        // Get all active phone numbers for debugging
        const { data: allNumbers } = await supabase
        .from('members')
        .select('*')
        .eq('phone', inputPhone)
        .eq('is_active', true)
        .single();
      }

      if (!member) {
        console.error('❌ No user found for phone:', inputPhone);
        return { 
          success: false, 
          error: `Phone number ${inputPhone} not found. Please contact admin.` 
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
          .select('phone')
          .eq('is_active', true);
        
        console.log('📱 Available phone numbers in database:', allNumbers?.map(n => n.phone));

        if (!error && member) {
          setUser(member);
          // Update stored user data
          // User no longer exists or is inactive
          localStorage.removeItem('jha-user');
          error: `Phone number not found. Available formats: ${allNumbers?.slice(0,3).map(n => n.phone).join(', ')}...` 
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