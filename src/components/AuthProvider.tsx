import React from 'react';
import { useAuthProvider } from '../hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();

  return (
    <auth.AuthContext.Provider value={auth}>
      {children}
    </auth.AuthContext.Provider>
  );
};