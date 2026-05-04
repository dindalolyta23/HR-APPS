import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getAttendanceStats, getAttendanceRecords } from '@features/attendance/services/attendanceService';
import { getEmployees } from '@features/employees/services/employeeService';
import { getChartData } from '@features/reports/services/reportService';
import { Button } from '@shared/components/ui/Button';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { AttendanceStatusBadge } from '@shared/components/ui/Badge';
import { useAuthStore } from '@features/auth/store/authStore';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { AttendanceRecord, Employee } from '@shared/types';
import type { ChartDataPoint } from '@features/reports/store/reportStore';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todayPresent: number;
  todayLate: number;
  todayAbsent: number;
  todayLeave: number;
  attendanceRate: number;
}

function StatCard({
  label,
  value,
  color,
  icon,
  onClick,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-5 ${onClick ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-tertiary)]">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${color.replace('text-', 'bg-').replace('600', '100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentRecords, setRecentRecords] = useState<(AttendanceRecord & { employee?: Employee })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0] ?? '';
  const sevenDaysAgo = subDays(new Date(), 7).toISOString().split('T')[0] ?? '';

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [todayStats, empResult, chart, todayRecords] = await Promise.all([
        getAttendanceStats({ startDate: today, endDate: today }),
        getEmployees({ pageSize: 1000 }),
        getChartData({ startDate: sevenDaysAgo, endDate: today }),
        getAttendanceRecords({ startDate: today, endDate: today }),
      ]);

      const activeCount = empResult.data.filter((e) => e.status === 'active').length;

      setStats({
        totalEmployees: empResult.total,
        activeEmployees: activeCount,
        todayPresent: todayStats.totalPresent,
        todayLate: todayStats.totalLate,
        todayAbsent: todayStats.totalAbsent,
        todayLeave: todayStats.totalLeave,
        attendanceRate: todayStats.attendanceRate,
      });

      setChartData(chart);

      // Enrich recent records with employee data
      const empMap = new Map<string, Employee>();
      for (const emp of empResult.data) {
        empMap.set(emp.id, emp);
      }

      const enriched = todayRecords
        .filter((r) => r.checkInTime !== null)
        .sort((a, b) => {
          const aTime = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
          const bTime = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 10)
        .map((r) => ({ ...r, employee: empMap.get(r.employeeId) }));

      setRecentRecords(enriched);
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
    }
  }, [today, sevenDaysAgo]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {greeting()}, {user?.name ?? 'Admin'}!
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })}
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} className="w-full" rounded="lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Karyawan"
              value={stats?.totalEmployees ?? 0}
              color="text-blue-600"
              icon={
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              onClick={() => void navigate('/employees')}
            />
            <StatCard
              label="Hadir Hari Ini"
              value={stats?.todayPresent ?? 0}
              color="text-green-600"
              icon={
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Terlambat"
              value={stats?.todayLate ?? 0}
              color="text-yellow-600"
              icon={
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Tidak Hadir"
              value={stats?.todayAbsent ?? 0}
              color="text-red-600"
              icon={
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {/* Attendance Rate */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                Tingkat Kehadiran Hari Ini
              </p>
              <span className="text-2xl font-bold text-blue-600">
                {stats?.attendanceRate ?? 0}%
              </span>
            </div>
            <div className="w-full rounded-full bg-[var(--color-bg-tertiary)] h-3">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${stats?.attendanceRate ?? 0}%` }}
              />
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Grafik 7 Hari Terakhir
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void navigate('/reports')}
            >
              Lihat Semua
            </Button>
          </div>
          {isLoading ? (
            <Skeleton height={200} className="w-full" rounded="lg" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                  tickFormatter={(v: string) => format(new Date(v), 'd/M', { locale: idLocale })}
                />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(label: string) =>
                    format(new Date(label), 'd MMM', { locale: idLocale })
                  }
                />
                <Bar dataKey="present" name="Hadir" fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="late" name="Terlambat" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="absent" name="Tidak Hadir" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-[var(--color-text-tertiary)]">Tidak ada data grafik.</p>
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Absensi Terbaru Hari Ini
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void navigate('/scanner')}
            >
              Buka Scanner
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={40} className="w-full" />
              ))}
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Belum ada absensi hari ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {record.employee?.fullName ?? record.employeeId}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {record.checkInTime
                        ? format(new Date(record.checkInTime), 'HH:mm')
                        : '-'}
                    </p>
                  </div>
                  <AttendanceStatusBadge status={record.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Scanner QR', path: '/scanner', icon: '📷' },
            { label: 'Karyawan', path: '/employees', icon: '👥' },
            { label: 'Laporan', path: '/reports', icon: '📊' },
            { label: 'Izin & Koreksi', path: '/leave', icon: '📝' },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => void navigate(action.path)}
              className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border)] p-4 hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
