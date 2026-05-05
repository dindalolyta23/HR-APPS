import { http, HttpResponse } from 'msw';
import { delay } from '../utils/delay';
import type { AuthUser, Session } from '@shared/types';

// In-memory session store
const activeSessions = new Map<string, { user: AuthUser; expiresAt: Date }>();

// Mock users
const mockUsers = [
  {
    id: 'user-admin-001',
    email: 'admin@hr-app.com',
    password: 'admin123',
    role: 'admin' as const,
    employeeId: null,
    name: 'Administrator',
  },
  {
    id: 'user-emp-001',
    email: 'budi@hr-app.com',
    password: 'emp123',
    role: 'employee' as const,
    employeeId: 'emp-001',
    name: 'Budi Santoso',
  },
];

// Lockout store
const lockoutStore = new Map<string, { failedAttempts: number; lockedUntil: Date | null }>();

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const authHandlers = [
  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    await delay();
    const body = await request.json() as { email: string; password: string };
    const email = body.email?.toLowerCase().trim();
    const { password } = body;

    const lockout = lockoutStore.get(email) ?? { failedAttempts: 0, lockedUntil: null };

    if (lockout.lockedUntil && lockout.lockedUntil > new Date()) {
      return HttpResponse.json(
        {
          message: 'Akun terkunci sementara karena terlalu banyak percobaan gagal.',
          lockoutInfo: {
            isLocked: true,
            lockedUntil: lockout.lockedUntil,
            failedAttempts: lockout.failedAttempts,
          },
        },
        { status: 401 }
      );
    }

    const user = mockUsers.find((u) => u.email === email);

    if (!user || user.password !== password) {
      const newAttempts = lockout.failedAttempts + 1;
      const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      lockoutStore.set(email, { failedAttempts: newAttempts, lockedUntil });

      return HttpResponse.json(
        {
          message:
            newAttempts >= 5
              ? 'Akun terkunci selama 15 menit karena terlalu banyak percobaan gagal.'
              : `Email atau password salah. ${5 - newAttempts} percobaan tersisa.`,
          lockoutInfo: {
            isLocked: lockedUntil !== null,
            lockedUntil,
            failedAttempts: newAttempts,
          },
        },
        { status: 401 }
      );
    }

    // Reset lockout
    lockoutStore.set(email, { failedAttempts: 0, lockedUntil: null });

    const authUser: AuthUser = {
      id: user.id,
      username: user.email,
      role: user.role,
      employeeId: user.employeeId,
      name: user.name,
    };

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    activeSessions.set(token, { user: authUser, expiresAt });

    const session: Session = { token, user: authUser, expiresAt };

    return HttpResponse.json({ data: { user: authUser, session } });
  }),

  // POST /api/auth/logout
  http.post('/api/auth/logout', async ({ request }) => {
    await delay();
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      activeSessions.delete(token);
    }
    return HttpResponse.json({ data: null, message: 'Berhasil keluar.' });
  }),
];
