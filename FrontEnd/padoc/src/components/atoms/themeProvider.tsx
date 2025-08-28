'use client';

import { useThemeInitializer } from '@/hooks/useThemeInitializer';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useThemeInitializer();
  
  return <>{children}</>;
}
