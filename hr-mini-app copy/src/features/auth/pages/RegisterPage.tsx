import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';

export default function RegisterPage() {
  const navigate = useNavigate();
  const storeRegister = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const storeError = useAuthStore((s) => s.error);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const displayError = localError || storeError;

  // Password strength
  const getPasswordStrength = (pw: string) => {
    if (pw.length === 0) return null;
    if (pw.length < 6) return { label: 'Terlalu pendek', color: 'bg-red-500', width: 'w-1/4' };
    if (pw.length < 8) return { label: 'Lemah', color: 'bg-orange-500', width: 'w-2/4' };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: 'Kuat', color: 'bg-green-500', width: 'w-full' };
    return { label: 'Sedang', color: 'bg-yellow-500', width: 'w-3/4' };
  };
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');

    if (!name.trim()) { setLocalError('Nama lengkap tidak boleh kosong.'); return; }
    if (!email.trim()) { setLocalError('Email tidak boleh kosong.'); return; }
    if (!password) { setLocalError('Password tidak boleh kosong.'); return; }
    if (password !== confirmPassword) { setLocalError('Konfirmasi password tidak cocok.'); return; }

    try {
      await storeRegister({ name: name.trim(), email: email.trim(), password, confirmPassword });
      setSuccess(true);
      setTimeout(() => void navigate('/dashboard', { replace: true }), 1500);
    } catch {
      // error handled by store
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] p-4">
        <div className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-primary)] p-8 shadow-[var(--shadow-modal)] text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Pendaftaran Berhasil!</h2>
          <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">Mengalihkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-[var(--color-bg-primary)] p-8 shadow-[var(--shadow-modal)]">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Buat Akun</h1>
            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">Daftar ke HR Mini App</p>
          </div>

          {/* Error */}
          {displayError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {displayError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            <Input
              label="Nama Lengkap"
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => { setName(e.target.value); setLocalError(''); }}
              disabled={isLoading}
              required
              fullWidth
              placeholder="Masukkan nama lengkap"
            />

            <Input
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
              disabled={isLoading}
              required
              fullWidth
              placeholder="nama@email.com"
            />

            <div>
              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
                disabled={isLoading}
                required
                fullWidth
                placeholder="Minimal 6 karakter"
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
              {/* Password strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-tertiary)]">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                    Kekuatan: <span className="font-medium">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Konfirmasi Password"
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(''); }}
              disabled={isLoading}
              required
              fullWidth
              placeholder="Ulangi password"
              error={confirmPassword && confirmPassword !== password ? 'Password tidak cocok' : undefined}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Sembunyikan' : 'Tampilkan'}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {showConfirm ? (
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              className="mt-2"
            >
              Daftar
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-[var(--color-text-tertiary)]">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
