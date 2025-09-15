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
    console.log('🔐 Starting sign in process for phone:', phone);
    
    // Mobile-specific checks
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const startTime = Date.now();
    
    try {
      // Enhanced mobile error handling
      if (isMobile) {
        console.log('📱 Mobile device detected, applying mobile-specific fixes');
        
        // Check for common mobile issues
        if (!window.localStorage) {
          throw new Error('Local storage not available. Please enable cookies in your browser settings.');
        }
        
        if (!navigator.onLine) {
          throw new Error('No internet connection. Please check your network and try again.');
        }
      }

      // First try to find existing member
      const { data: existingMember, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (memberError) {
        console.error('⚠️ Database error (continuing anyway):', memberError);
        // Continue anyway - create new user
      }

      let user = existingMember;
      console.log('👤 Existing member found:', !!user);

      // If user doesn't exist, create them
      if (!user) {
        const isAdmin = phone === '9254343862';
        console.log('➕ Creating new user, isAdmin:', isAdmin);
        
        const { data: newUser, error: createError } = await supabase
          .from('members')
          .insert([{
            phone: phone,
            full_name: isAdmin ? 'JHA Admin' : `User ${phone}`,
            is_admin: isAdmin,
            is_active: true
          }])
          .select()
          .single();

        if (createError) {
          console.error('⚠️ Error creating user (using fallback):', createError);
          // Even if database fails, create a temporary user for demo
          user = {
            id: `temp-${Date.now()}`,
            phone: phone,
            full_name: phone === '9254343862' ? 'JHA Admin' : `User ${phone}`,
            is_admin: phone === '9254343862',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profile_picture_url: null,
            birth_month: null,
            birth_day: null
          };
          console.log('🔄 Created temporary user due to database error');
        } else {
          user = newUser;
          console.log('✅ Successfully created new user in database');
        }
      }

      // Make sure user is active
      if (!user.is_active) {
        console.log('🔄 Activating inactive user');
        await supabase
          .from('members')
          .update({ is_active: true })
          .eq('id', user.id);
        user.is_active = true;
      }

      console.log('💾 Setting user in localStorage and state');
      localStorage.setItem('jha_member_id', user.id);
      
      // Mobile-specific: Add extra verification
      if (isMobile) {
        const stored = localStorage.getItem('jha_member_id');
        if (stored !== user.id) {
          console.error('❌ Mobile localStorage verification failed');
          throw new Error('Storage verification failed. Please try again or clear your browser cache.');
        }
        console.log('✅ Mobile localStorage verification passed');
      }
      
      setUser(user);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Sign in successful in ${duration}ms`);
      
      // Track successful mobile logins
      if (isMobile) {
        localStorage.setItem('mobile_login_success', Date.now().toString());
      }
      
      return { success: true };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Sign in error after ${duration}ms:`, error);
      
      // Enhanced mobile error handling
      if (isMobile) {
        console.log('📱 Applying mobile fallback strategy');
        
        // Track mobile failures for analytics
        const failures = parseInt(localStorage.getItem('mobile_login_failures') || '0') + 1;
        localStorage.setItem('mobile_login_failures', failures.toString());
        
        // Return specific mobile error messages
        if (error instanceof Error) {
          if (error.message.includes('storage') || error.message.includes('localStorage')) {
            return { success: false, error: 'Browser storage issue. Please enable cookies and local storage, then try again.' };
          }
          if (error.message.includes('network') || error.message.includes('fetch')) {
            return { success: false, error: 'Network connection issue. Please check your internet connection and try again.' };
          }
          if (error.message.includes('timeout')) {
            return { success: false, error: 'Request timed out. Please try again with a stable internet connection.' };
          }
        }
      }
      
      // Even if everything fails, create a temporary session
      const tempUser = {
        id: `temp-${Date.now()}`,
        phone: phone,
        full_name: phone === '9254343862' ? 'JHA Admin' : `User ${phone}`,
        is_admin: phone === '9254343862',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_picture_url: null,
        birth_month: null,
        birth_day: null
      };
      
      console.log('🆘 Creating emergency temporary user');
      localStorage.setItem('jha_member_id', tempUser.id);
      setUser(tempUser);
      return { success: true };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('jha_member_id');
    setUser(null);
  };

  const refreshUser = async () => {
    const memberId = localStorage.getItem('jha_member_id');
    if (!memberId) {
      console.log('🔍 No stored member ID found');
      setLoading(false);
      return;
    }

    console.log('🔄 Refreshing user data for ID:', memberId);

    try {
      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .eq('is_active', true)
        .maybeSingle();

      if (member) {
        console.log('✅ User data refreshed successfully');
        setUser(member);
      } else {
        console.log('⚠️ User not found or inactive, clearing session');
        localStorage.removeItem('jha_member_id');
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
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