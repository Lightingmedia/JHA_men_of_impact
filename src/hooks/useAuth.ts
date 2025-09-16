import { useState, useEffect, createContext, useContext } from 'react';

export const AuthContext = createContext();

export const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signInWithPhone = async (phoneNumber) => {
    try {
      setLoading(true);
      // Sign in logic here
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
    try {
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(false);
    } catch (error) {
      console.error('❌ Refresh user error:', error);
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