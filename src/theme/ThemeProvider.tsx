import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'work-show-theme';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch {
        /* Storage may be disabled. */
      }
      const next: Theme =
        saved === 'dark' || saved === 'studio'
          ? 'dark'
          : saved === 'light' || saved === 'editorial'
            ? 'light'
            : media.matches
              ? 'dark'
              : 'light';
      setTheme(next);
      applyTheme(next);
    };
    read();
    media.addEventListener('change', read);
    window.addEventListener('storage', read);
    return () => {
      media.removeEventListener('change', read);
      window.removeEventListener('storage', read);
    };
  }, []);
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* Session-only preference is still supported. */
    }
    setTheme(next);
    applyTheme(next);
  }
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.style = theme === 'dark' ? 'studio' : 'editorial';
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#151719' : '#f6f5f1');
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('Missing ThemeProvider');
  return context;
}
