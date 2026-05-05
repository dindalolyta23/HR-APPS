import { useEffect, type ReactNode } from 'react';
import { useUIStore } from '@shared/stores/uiStore';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * ThemeProvider — applies the current theme to the document root.
 */
function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return <>{children}</>;
}

/**
 * NetworkStatusProvider — tracks online/offline status.
 */
function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const setOnline = useUIStore((s) => s.setOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return <>{children}</>;
}

/**
 * Root providers wrapper.
 * Add MSW, React Query, or other providers here as needed.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <NetworkStatusProvider>
        {children}
      </NetworkStatusProvider>
    </ThemeProvider>
  );
}
