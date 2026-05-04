import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials } from '@shared/types';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Hook for authentication state and actions.
 * Includes idle timer that auto-logs out after 30 minutes of inactivity.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const lockoutInfo = useAuthStore((s) => s.lockoutInfo);
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);
  const checkSession = useAuthStore((s) => s.checkSession);

  const navigate = useNavigate();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAuthenticated = !!user && !!session;

  // ─── Session validation on mount ─────────────────────────────────────────
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // ─── Idle timer ──────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (isAuthenticated) {
      idleTimerRef.current = setTimeout(() => {
        void storeLogout().then(() => {
          void navigate('/login', { replace: true });
        });
      }, IDLE_TIMEOUT_MS);
    }
  }, [isAuthenticated, storeLogout, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => resetIdleTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isAuthenticated, resetIdleTimer]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await storeLogin(credentials);
    },
    [storeLogin]
  );

  const logout = useCallback(async () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    await storeLogout();
    void navigate('/login', { replace: true });
  }, [storeLogout, navigate]);

  return {
    user,
    session,
    isLoading,
    error,
    lockoutInfo,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    login,
    logout,
  };
}
