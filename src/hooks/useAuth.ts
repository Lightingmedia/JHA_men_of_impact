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
      
      // Get ALL active members from database
      const { data: allMembers, error: fetchError } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true);

      if (fetchError) {
        console.error('❌ Database fetch error:', fetchError);
        return { success: false, error: 'Database connection error. Please try again.' };
      }

      if (!allMembers || allMembers.length === 0) {
        console.error('❌ No active members found in database');
        return { success: false, error: 'No active members found. Please contact admin.' };
      }

      console.log('📱 Available members:', allMembers.length);
      console.log('📱 Available phone numbers:', allMembers.map(m => m.phone));

      // Try to find matching member with flexible phone matching
      let foundMember = null;

      // Remove all non-digits from input for comparison
      const inputDigits = inputPhone.replace(/\D/g, '');
      console.log('🔍 Input digits only:', inputDigits);

      // Search through all members
      for (const member of allMembers) {
        const memberPhone = member.phone;
        const memberDigits = memberPhone.replace(/\D/g, '');
        
        console.log(`🔍 Comparing input "${inputDigits}" with member "${memberPhone}" (digits: "${memberDigits}")`);
        
        // Try multiple matching strategies
        const matches = [
          // Exact match
          inputPhone === memberPhone,
          // Digits only match
          inputDigits === memberDigits,
          // Input contains member digits
          inputDigits.includes(memberDigits),
          // Member digits contain input
          memberDigits.includes(inputDigits),
          // Last 10 digits match (US phone numbers)
          inputDigits.length >= 10 && memberDigits.length >= 10 && 
          inputDigits.slice(-10) === memberDigits.slice(-10),
          // Last 7 digits match (local numbers)
          inputDigits.length >= 7 && memberDigits.length >= 7 && 
          inputDigits.slice(-7) === memberDigits.slice(-7),
          // Case insensitive partial match
          memberPhone.toLowerCase().includes(inputPhone.toLowerCase()),
          inputPhone.toLowerCase().includes(memberPhone.toLowerCase())
        ];

        if (matches.some(match => match)) {
          foundMember = member;
          console.log('✅ Found matching member:', member.full_name, 'with phone:', member.phone);
          break;
        }
      }

      // If still no match, try fuzzy search on any part of the phone number
      if (!foundMember) {
        console.log('🔍 Trying fuzzy search...');
        for (const member of allMembers) {
          const memberPhone = member.phone.replace(/\D/g, '');
          const inputClean = inputPhone.replace(/\D/g, '');
          
          // Check if any 4+ digit sequence matches
          if (inputClean.length >= 4 && memberPhone.includes(inputClean)) {
            foundMember = member;
            console.log('✅ Found fuzzy match:', member.full_name);
            break;
          }
          
          if (memberPhone.length >= 4 && inputClean.includes(memberPhone)) {
            foundMember = member;
            console.log('✅ Found reverse fuzzy match:', member.full_name);
            break;
          }
        }
      }

      if (!foundMember) {
        console.error('❌ No matching member found for input:', inputPhone);
        console.log('📋 Available phone numbers in database:');
        allMembers.forEach((member, index) => {
          console.log(`${index + 1}. ${member.full_name}: ${member.phone}`);
        });
        
        return { 
          success: false, 
          error: `Phone number not found. Available numbers include: ${allMembers.slice(0, 3).map(m => m.phone).join(', ')}${allMembers.length > 3 ? '...' : ''}` 
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