import { useEffect } from 'react';
import useThemeStore from '@/store/themeStore';

export function useThemeInitializer() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);
}
