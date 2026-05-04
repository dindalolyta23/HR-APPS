import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getLockoutInfo } from '../services/authService';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';

function useLockoutCountdown(lockedUntil: Date | null): string {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!lockedUntil) { setRemaining(''); return; }
    const update = () => {
      const diff = new Date(lockedUntil).getTime() - Date.now();
      if (diff <= 0) { setRemaining(''); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  return remaining;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const storeLogin = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const storeError = useAuthStore((s) => s.error);
  const storeLockoutInfo = useAuthStore((s) => s.lockoutInfo);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [lockoutInfo, setLockoutInfo] = useState(storeLockoutInfo);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setLockoutInfo(storeLockoutInfo); }, [storeLockoutInfo]);

  useEffect(() => {
    if (lockoutInfo?.isLocked && email) {
      pollRef.current = setInterval(() => {
        const fresh = getLockoutInfo(email.toLowerCase().trim());
        setLockoutInfo(fresh);
        if (!fresh.isLocked && pollRef.current) clearInterval(pollRef.current);
      }, 1000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [lockoutInfo?.isLocked, email]);

  const countdown = useLockoutCountdown(lockoutInfo?.lockedUntil ?? null);
  const isLocked = lockoutInfo?.isLocked ?? false;
  const displayError = localError || storeError;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) { setLocalError('Email tidak boleh kosong.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Format email tidak valid.');
      return;
    }
    if (!password) { setLocalError('Password tidak boleh kosong.'); return; }

    try {
      await storeLogin({ email: email.trim(), password, rememberMe });
      void navigate('/dashboard', { replace: true });
    } catch {
      // error handled by store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl bg-[var(--color-bg-primary)] p-8 shadow-[var(--shadow-modal)]">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Selamat Datang</h1>
            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">Masuk ke HR Mini App</p>
          </div>

          {/* Lockout banner */}
          {isLocked && countdown && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              <p className="font-semibold">Akun terkunci sementara</p>
              <p className="mt-0.5">Coba lagi dalam <span className="font-mono font-bold">{countdown}</span></p>
            </div>
          )}

          {/* Error */}
          {displayError && !isLocked && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {displayError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            <Input
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
              disabled={isLoading || isLocked}
              required
              fullWidth
              placeholder="nama@email.com"
            />

            <Input
              label="Password"
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
              disabled={isLoading || isLocked}
              required
              fullWidth
              placeholder="Masukkan password"
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              }
            />

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading || isLocked}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-sm text-[var(--color-text-secondary)]">Ingat Saya</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none"
                onClick={() => alert('Fitur lupa password akan segera hadir.')}
              >
                Lupa password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLocked}
              className="mt-2"
            >
              {isLocked ? 'Akun Terkunci' : 'Masuk'}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-disabled)]">atau</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-[var(--color-text-tertiary)]">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
