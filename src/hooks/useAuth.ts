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
      const cleanPhone = phoneNumber.trim().replace(/\D/g, ''); // Remove all non-digits
      const originalPhone = phoneNumber.trim();
      console.log('🔐 Attempting to sign in with phone:', cleanPhone);
      
      // Try multiple phone number formats
      const phoneVariants = [
        originalPhone,
        cleanPhone,
        `+1${cleanPhone}`,
        `+1 (${cleanPhone.slice(0,3)}) ${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}`,
        `(${cleanPhone.slice(0,3)}) ${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}`,
        `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}`
      ];
      
      console.log('🔍 Trying phone variants:', phoneVariants);
      
      let member = null;
      let error = null;
      
      // Try each phone variant
      for (const phoneVariant of phoneVariants) {
        const { data, error: queryError } = await supabase
          .from('members')
          .select('*')
          .eq('phone', phoneVariant)
          .eq('is_active', true)
          .single();
          
        if (!queryError && data) {
          member = data;
          console.log('✅ Found user with phone variant:', phoneVariant);
          break;
        }
      }
      
      if (!member) {
        // Final attempt with LIKE search for partial matches
        const { data: likeResults, error: likeError } = await supabase
        .from('members')
        .select('*')
        .or(`phone.like.%${cleanPhone}%,phone.like.%${originalPhone}%`)
        .eq('is_active', true);
        
        if (!likeError && likeResults && likeResults.length > 0) {
          member = likeResults[0];
          console.log('✅ Found user with LIKE search:', member.phone);
        }
      }

      if (!member) {
        console.error('❌ No user found for phone variants:', phoneVariants);
        return { 
          success: false, 
          error: `Phone number not found. Tried: ${originalPhone}. Please contact admin to add your number.` 
        };
      }

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Database error:', error);
        return { 
          success: false, 
          error: 'Connection error. Please try again.' 
        };
      }

      console.log('✅ User found:', member.full_name, 'Phone in DB:', member.phone);
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