'use client';

import { useState, useRef, useEffect } from 'react';
import useThemeStore, { Theme } from '@/store/themeStore';

const themes: { value: Theme; label: string; }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

interface ThemeSelectorProps {
  compact?: boolean;
}

export default function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme = themes.find(t => t.value === theme) || themes[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? '4px' : '8px',
          padding: compact ? '6px 8px' : '8px 12px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--text)',
          cursor: 'pointer',
          fontSize: compact ? '12px' : '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          minWidth: compact ? '80px' : 'auto',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-light)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--card)';
        }}
      >
        <span>{currentTheme.label}</span>
        <span style={{ 
          fontSize: compact ? '10px' : '12px', 
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          minWidth: compact ? '100px' : '120px',
        }}>
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              onClick={() => handleThemeChange(themeOption.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: compact ? '4px' : '8px',
                width: '100%',
                padding: compact ? '8px 10px' : '10px 12px',
                backgroundColor: theme === themeOption.value ? 'var(--accent-weak)' : 'transparent',
                border: 'none',
                color: theme === themeOption.value ? 'var(--accent)' : 'var(--text)',
                cursor: 'pointer',
                fontSize: compact ? '12px' : '14px',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (theme !== themeOption.value) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-light)';
                }
              }}
              onMouseLeave={(e) => {
                if (theme !== themeOption.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{themeOption.label}</span>
              {theme === themeOption.value && (
                <span style={{ marginLeft: 'auto', fontSize: compact ? '10px' : '12px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
