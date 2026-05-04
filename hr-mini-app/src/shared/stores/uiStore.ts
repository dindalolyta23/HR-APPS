import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, ToastMessage } from '@shared/types';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  notifications: ToastMessage[];
  isOnline: boolean;
}

interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<ToastMessage, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setOnline: (online: boolean) => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
  theme: 'system',
  sidebarOpen: true,
  notifications: [],
  isOnline: navigator.onLine,
};

let notificationIdCounter = 0;

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      addNotification: (notification) => {
        const id = `toast-${++notificationIdCounter}`;
        const toast: ToastMessage = { id, duration: 4000, ...notification };
        set((state) => ({
          notifications: [...state.notifications, toast],
        }));
        // Auto-remove after duration
        const duration = toast.duration ?? 4000;
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        }, duration);
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
      setOnline: (isOnline) => set({ isOnline }),
    }),
    {
      name: 'hr-ui-store',
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
    }
  )
);
