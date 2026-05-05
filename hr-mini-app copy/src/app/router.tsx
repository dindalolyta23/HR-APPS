import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@shared/components/layout/AppShell';
import { ErrorBoundary } from '@shared/components/feedback/ErrorBoundary';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { useAuthStore } from '@features/auth/store/authStore';

// ─── Lazy-loaded pages ───────────────────────────────────────────────────────

const LoginPage = lazy(() => import('@features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@features/auth/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@features/auth/pages/DashboardPage'));
const EmployeesPage = lazy(() => import('@features/employees/pages/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('@features/employees/pages/EmployeeDetailPage'));
const ScannerPage = lazy(() => import('@features/attendance/pages/ScannerPage'));
const SchedulePage = lazy(() => import('@features/schedule/pages/SchedulePage'));
const ReportsPage = lazy(() => import('@features/reports/pages/ReportsPage'));
const LeavePage = lazy(() => import('@features/leave/pages/LeavePage'));
const MyAttendancePage = lazy(() => import('@features/attendance/pages/MyAttendancePage'));
const MyQRPage = lazy(() => import('@features/employees/pages/MyQRPage'));

// ─── Loading fallback ────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4">
        <Skeleton height={32} className="w-1/3" />
        <Skeleton height={16} className="w-full" />
        <Skeleton height={16} className="w-5/6" />
        <Skeleton height={200} className="w-full" rounded="lg" />
      </div>
    </div>
  );
}

// ─── Route guards ────────────────────────────────────────────────────────────

/**
 * ProtectedRoute — redirects to /login if not authenticated.
 */
function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const location = useLocation();

  const isAuthenticated = !!user && !!session;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

/**
 * AdminRoute — redirects to /dashboard if not admin.
 */
function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const location = useLocation();

  const isAuthenticated = !!user && !!session;
  const isAdmin = user?.role === 'admin';

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/my-attendance" replace />;
  }

  return <Outlet />;
}

/**
 * GuestRoute — redirects to /dashboard if already authenticated.
 */
function GuestRoute() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);

  const isAuthenticated = !!user && !!session;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

// ─── Router configuration ────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Guest-only routes
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
        errorElement: <ErrorBoundary><div>Halaman tidak ditemukan</div></ErrorBoundary>,
      },
      {
        path: '/register',
        element: <RegisterPage />,
        errorElement: <ErrorBoundary><div>Halaman tidak ditemukan</div></ErrorBoundary>,
      },
    ],
  },

  // Protected routes (all authenticated users)
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary><div>Terjadi kesalahan</div></ErrorBoundary>,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      // Employee-accessible routes
      {
        path: 'my-attendance',
        element: <MyAttendancePage />,
      },
      {
        path: 'my-qr',
        element: <MyQRPage />,
      },
      // Admin-only routes
      {
        element: <AdminRoute />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'employees',
            element: <EmployeesPage />,
          },
          {
            path: 'employees/new',
            element: <EmployeesPage />,
          },
          {
            path: 'employees/:id',
            element: <EmployeeDetailPage />,
          },
          {
            path: 'scanner',
            element: <ScannerPage />,
          },
          {
            path: 'schedule',
            element: <SchedulePage />,
          },
          {
            path: 'reports',
            element: <ReportsPage />,
          },
          {
            path: 'leave',
            element: <LeavePage />,
          },
        ],
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
