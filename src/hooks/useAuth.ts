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
    
    try {
      // First try to find existing member
      const { data: existingMember, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (memberError) {
        console.error('⚠️ Database error:', memberError);
        throw new Error('Database connection error. Please try again.');
      }

      if (!existingMember) {
        throw new Error('User not found. Please complete registration first.');
      }

      const user = existingMember;
      console.log('👤 Existing member found:', user.full_name);

      // Make sure user is active
      if (!user.is_active) {
        throw new Error('Account is inactive. Please contact an administrator.');
      }

      console.log('💾 Setting user in localStorage and state');
      localStorage.setItem('jha_member_id', user.id);
      setUser(user);
      
      console.log('✅ Sign in successful');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed. Please try again.' 
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
      console.log('🔍 No stored member ID found');
      setLoading(false);
      return;
    }

    console.log('🔄 Refreshing user data for ID:', memberId);

    try {
      // Test database connection
      console.log('🔍 Testing database connection...');
      const { error: connectionError } = await supabase
        .from('members')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        console.error('❌ Database connection failed:', connectionError);
        throw new Error('Database connection failed');
      }
      
      console.log('✅ Database connection successful');
      
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