import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, LockoutInfo, Session } from '@shared/types';
import { login as authLogin, logout as authLogout, register as authRegister, isSessionValid, getCurrentSession } from '../services/authService';
import type { LoginCredentials, RegisterCredentials } from '@shared/types';

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  lockoutInfo: LockoutInfo | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLockoutInfo: (info: LockoutInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => void;
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  session: null,
  lockoutInfo: null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLockoutInfo: (lockoutInfo) => set({ lockoutInfo }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const { user, session } = await authLogin(credentials);
          set({ user, session, lockoutInfo: null, isLoading: false, error: null });
        } catch (err) {
          const authError = err as { message: string; lockoutInfo?: LockoutInfo };
          set({
            isLoading: false,
            error: authError.message ?? 'Terjadi kesalahan saat login.',
            lockoutInfo: authError.lockoutInfo ?? null,
          });
          throw err;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const { user, session } = await authRegister(credentials);
          set({ user, session, lockoutInfo: null, isLoading: false, error: null });
        } catch (err) {
          const authError = err as { message: string };
          set({
            isLoading: false,
            error: authError.message ?? 'Terjadi kesalahan saat mendaftar.',
          });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authLogout();
        } finally {
          set(initialState);
          // Clear persisted storage
          localStorage.removeItem('hr-auth-store');
        }
      },

      checkSession: () => {
        const { session } = get();
        if (session && !isSessionValid(session)) {
          set(initialState);
          localStorage.removeItem('hr-auth-store');
        }
        // Also try to restore from Supabase
        void getCurrentSession().then((result) => {
          if (result) {
            set({ user: result.user, session: result.session });
          }
        });
      },

      reset: () => {
        set(initialState);
        localStorage.removeItem('hr-auth-store');
      },
    }),
    {
      name: 'hr-auth-store',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);
