import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@shared/utils/cn';
import { useUIStore } from '@shared/stores/uiStore';
import type { ToastMessage } from '@shared/types';

const typeConfig = {
  success: {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    classes: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    iconClasses: 'text-green-500',
  },
  error: {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    classes: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    iconClasses: 'text-red-500',
  },
  warning: {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    classes: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    iconClasses: 'text-yellow-500',
  },
  info: {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    classes: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    iconClasses: 'text-blue-500',
  },
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const removeNotification = useUIStore((s) => s.removeNotification);
  const config = typeConfig[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-up',
        'min-w-[300px] max-w-[420px]',
        config.classes
      )}
    >
      <span className={cn('mt-0.5 shrink-0', config.iconClasses)}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm opacity-90">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeNotification(toast.id)}
        aria-label="Tutup notifikasi"
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const notifications = useUIStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return createPortal(
    <div
      aria-label="Notifikasi"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {notifications.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
}

/**
 * Hook to show toast notifications.
 */
export function useToast() {
  const addNotification = useUIStore((s) => s.addNotification);

  return {
    toast: addNotification,
    success: (title: string, description?: string) =>
      addNotification({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addNotification({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addNotification({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addNotification({ type: 'info', title, description }),
  };
}
