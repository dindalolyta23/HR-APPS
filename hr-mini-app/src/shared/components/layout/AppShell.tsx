import type { ReactNode } from 'react';
import { cn } from '@shared/utils/cn';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { useUIStore } from '@shared/stores/uiStore';
import { ToastContainer } from '@shared/components/feedback/Toast';
import { ErrorBoundary } from '@shared/components/feedback/ErrorBoundary';

interface AppShellProps {
  children: ReactNode;
  pageTitle?: string;
}

export function AppShell({ children, pageTitle }: AppShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const isOnline = useUIStore((s) => s.isOnline);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      {/* Sidebar — desktop only (≥768px) */}
      <div
        className={cn(
          'hidden md:flex flex-shrink-0 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar title={pageTitle} />

        {/* Offline banner */}
        {!isOnline && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span>Anda sedang offline. Beberapa fitur mungkin tidak tersedia.</span>
          </div>
        )}

        {/* Page content */}
        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-y-auto',
            // Add bottom padding on mobile for BottomNav
            'pb-0 md:pb-0',
            'pb-16 md:pb-0' // space for bottom nav on mobile
          )}
          tabIndex={-1}
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Bottom navigation — mobile only (<768px) */}
      <div className="md:hidden">
        <BottomNav />
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
