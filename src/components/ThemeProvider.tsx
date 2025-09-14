import React from 'react';
import { useThemeProvider } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useThemeProvider();

  return (
    <theme.ThemeContext.Provider value={theme}>
      {children}
    </theme.ThemeContext.Provider>
  );
};