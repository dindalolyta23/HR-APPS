import { supabase } from '@/lib/supabase';
import type { AuthUser, LoginCredentials, LockoutInfo, Session } from '@shared/types';
import type { RegisterCredentials } from '@shared/types';

// ─── Lockout (in-memory, keyed by email) ─────────────────────────────────────
interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: Date | null;
}

const lockoutStore = new Map<string, LockoutRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function getLockoutRecord(email: string): LockoutRecord {
  return lockoutStore.get(email) ?? { failedAttempts: 0, lockedUntil: null };
}

function saveLockoutRecord(email: string, record: LockoutRecord): void {
  lockoutStore.set(email, record);
}

export interface AuthServiceResult {
  user: AuthUser;
  session: Session;
}

export interface AuthServiceError {
  message: string;
  lockoutInfo?: LockoutInfo;
}

export function getLockoutInfo(email: string): LockoutInfo {
  const record = getLockoutRecord(email);
  const now = new Date();

  if (record.lockedUntil && record.lockedUntil <= now) {
    saveLockoutRecord(email, { failedAttempts: 0, lockedUntil: null });
    return { isLocked: false, lockedUntil: null, failedAttempts: 0 };
  }

  return {
    isLocked: record.lockedUntil !== null && record.lockedUntil > now,
    lockedUntil: record.lockedUntil,
    failedAttempts: record.failedAttempts,
  };
}

function mapSupabaseUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthUser {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    username: supabaseUser.email ?? '',
    role: (meta['role'] as AuthUser['role']) ?? 'employee',
    employeeId: (meta['employee_id'] as string) ?? null,
    name: (meta['name'] as string) ?? supabaseUser.email ?? 'User',
  };
}

/**
 * Login with email + password via Supabase Auth.
 */
export async function login(credentials: LoginCredentials): Promise<AuthServiceResult> {
  const { email, password } = credentials;
  const normalizedEmail = email.toLowerCase().trim();
  const lockoutInfo = getLockoutInfo(normalizedEmail);

  if (lockoutInfo.isLocked) {
    throw { message: 'Akun terkunci sementara karena terlalu banyak percobaan gagal.', lockoutInfo } as AuthServiceError;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user || !data.session) {
    const record = getLockoutRecord(normalizedEmail);
    const newFailedAttempts = record.failedAttempts + 1;
    const lockedUntil = newFailedAttempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_DURATION_MS)
      : null;

    saveLockoutRecord(normalizedEmail, { failedAttempts: newFailedAttempts, lockedUntil });
    const updatedLockout = getLockoutInfo(normalizedEmail);

    throw {
      message: newFailedAttempts >= MAX_FAILED_ATTEMPTS
        ? 'Akun terkunci selama 15 menit karena terlalu banyak percobaan gagal.'
        : `Email atau password salah. ${MAX_FAILED_ATTEMPTS - newFailedAttempts} percobaan tersisa.`,
      lockoutInfo: updatedLockout,
    } as AuthServiceError;
  }

  // Reset lockout on success
  saveLockoutRecord(normalizedEmail, { failedAttempts: 0, lockedUntil: null });

  const user = mapSupabaseUser(data.user);
  const session: Session = {
    token: data.session.access_token,
    user,
    expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 8 * 60 * 60 * 1000),
  };

  return { user, session };
}

/**
 * Register new user via Supabase Auth.
 */
export async function register(credentials: RegisterCredentials): Promise<AuthServiceResult> {
  const { name, email, password, confirmPassword } = credentials;
  const normalizedEmail = email.toLowerCase().trim();

  if (!name.trim() || name.trim().length < 2) {
    throw { message: 'Nama lengkap minimal 2 karakter.' } as AuthServiceError;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw { message: 'Format email tidak valid.' } as AuthServiceError;
  }
  if (password.length < 6) {
    throw { message: 'Password minimal 6 karakter.' } as AuthServiceError;
  }
  if (password !== confirmPassword) {
    throw { message: 'Konfirmasi password tidak cocok.' } as AuthServiceError;
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: name.trim(),
        role: 'employee',
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      throw { message: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.' } as AuthServiceError;
    }
    throw { message: error.message } as AuthServiceError;
  }

  if (!data.user) {
    throw { message: 'Pendaftaran gagal. Coba lagi.' } as AuthServiceError;
  }

  // If email confirmation is required, session might be null
  if (!data.session) {
    // Auto sign in after register
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError || !signInData.user || !signInData.session) {
      throw { message: 'Akun dibuat. Silakan masuk dengan email dan password Anda.' } as AuthServiceError;
    }

    const user = mapSupabaseUser(signInData.user);
    const session: Session = {
      token: signInData.session.access_token,
      user,
      expiresAt: new Date(signInData.session.expires_at ? signInData.session.expires_at * 1000 : Date.now() + 8 * 60 * 60 * 1000),
    };
    return { user, session };
  }

  const user = mapSupabaseUser(data.user);
  const session: Session = {
    token: data.session.access_token,
    user,
    expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 8 * 60 * 60 * 1000),
  };

  return { user, session };
}

/**
 * Logout via Supabase Auth.
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Check if session is still valid.
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  return new Date(session.expiresAt) > new Date();
}

/**
 * Get current Supabase session (for app init).
 */
export async function getCurrentSession(): Promise<AuthServiceResult | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;

  const user = mapSupabaseUser(data.session.user);
  const session: Session = {
    token: data.session.access_token,
    user,
    expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 8 * 60 * 60 * 1000),
  };

  return { user, session };
}
