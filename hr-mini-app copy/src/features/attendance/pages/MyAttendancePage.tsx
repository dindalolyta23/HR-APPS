import { useEffect, useState, useCallback } from 'react';
import { getAttendanceRecords } from '../services/attendanceService';
import { AttendanceStatusBadge } from '@shared/components/ui/Badge';
import { Button } from '@shared/components/ui/Button';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { EmptyState } from '@shared/components/feedback/EmptyState';
import { useAuthStore } from '@features/auth/store/authStore';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { AttendanceRecord } from '@shared/types';

export default function MyAttendancePage() {
  const user = useAuthStore((s) => s.user);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0] ?? '';
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0] ?? '';

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const fetchRecords = useCallback(async () => {
    if (!user?.employeeId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getAttendanceRecords({
        startDate,
        endDate,
        employeeId: user.employeeId,
      });
      setRecords(data.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.employeeId, startDate, endDate]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const stats = {
    present: records.filter((r) => r.status === 'present').length,
    late: records.filter((r) => r.status === 'late').length,
    absent: records.filter((r) => r.status === 'absent').length,
    leave: records.filter((r) => r.status === 'leave').length,
  };

  const total = stats.present + stats.late + stats.absent + stats.leave;
  const attendanceRate = total > 0 ? Math.round(((stats.present + stats.late) / total) * 100) : 0;

  if (!user?.employeeId) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Kehadiran Saya</h1>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Akun belum terdaftar sebagai karyawan</h2>
          <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
            Akun Anda sudah aktif, tapi belum terhubung dengan data karyawan.
            Hubungi administrator untuk menghubungkan akun Anda.
          </p>
          <div className="mt-4 rounded-lg bg-[var(--color-bg-secondary)] p-3 text-left text-xs text-[var(--color-text-tertiary)]">
            <p className="font-medium text-[var(--color-text-secondary)]">Info akun:</p>
            <p>Email: {user?.username}</p>
            <p>Nama: {user?.name}</p>
            <p>Role: {user?.role}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Kehadiran Saya</h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          Riwayat kehadiran pribadi Anda
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--color-text-tertiary)]">Dari</label>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--color-text-tertiary)]">Sampai</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={today}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Hadir</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Terlambat</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Tidak Hadir</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Kehadiran</p>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} height={48} className="w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-[var(--color-text-tertiary)]">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => void fetchRecords()}>
              Coba Lagi
            </Button>
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            title="Tidak ada data"
            description="Tidak ada data kehadiran untuk periode yang dipilih."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="bg-[var(--color-bg-secondary)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Tanggal</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Masuk</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Keluar</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Durasi</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                      {format(new Date(record.date), 'EEE, d MMM yyyy', { locale: idLocale })}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {record.checkInTime
                        ? format(new Date(record.checkInTime), 'HH:mm')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {record.checkOutTime
                        ? format(new Date(record.checkOutTime), 'HH:mm')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {record.workDuration !== null
                        ? `${Math.floor(record.workDuration / 60)}j ${record.workDuration % 60}m`
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceStatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
