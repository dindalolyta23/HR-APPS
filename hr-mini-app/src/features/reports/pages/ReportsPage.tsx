import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getAttendanceSummaries, getChartData } from '../services/reportService';
import { exportToExcel, generateFilename } from '../services/exportService';
import { useReportStore } from '../store/reportStore';
import { Button } from '@shared/components/ui/Button';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { EmptyState } from '@shared/components/feedback/EmptyState';
import { Modal } from '@shared/components/ui/Modal';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { AttendanceFilters, EmployeeAttendanceSummary } from '@shared/types';

const DEPARTMENTS = ['all', 'Engineering', 'HR', 'Finance', 'Marketing', 'Operations'];

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-5">
      <p className="text-sm text-[var(--color-text-tertiary)]">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DailyDetailModal({
  summary,
  onClose,
}: {
  summary: EmployeeAttendanceSummary | null;
  onClose: () => void;
}) {
  if (!summary) return null;

  return (
    <Modal
      isOpen={!!summary}
      onClose={onClose}
      title={`Detail Kehadiran — ${summary.employee.fullName}`}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <p className="text-xs text-green-600">Hadir</p>
            <p className="text-2xl font-bold text-green-700">{summary.totalPresent}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-xs text-yellow-600">Terlambat</p>
            <p className="text-2xl font-bold text-yellow-700">{summary.totalLate}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-xs text-red-600">Tidak Hadir</p>
            <p className="text-2xl font-bold text-red-700">{summary.totalAbsent}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-600">Izin</p>
            <p className="text-2xl font-bold text-blue-700">{summary.totalLeave}</p>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-text-tertiary)]">Persentase Kehadiran</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 rounded-full bg-[var(--color-bg-tertiary)] h-3">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all"
                style={{ width: `${summary.attendancePercentage}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {summary.attendancePercentage}%
            </span>
          </div>
        </div>
        <Button variant="secondary" fullWidth onClick={onClose}>
          Tutup
        </Button>
      </div>
    </Modal>
  );
}

export default function ReportsPage() {
  const { summaries, chartData, filters, isLoading, error, setSummaries, setChartData, setFilters, setLoading, setError } =
    useReportStore();

  const [selectedSummary, setSelectedSummary] = useState<EmployeeAttendanceSummary | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const today = new Date().toISOString().split('T')[0] ?? '';
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0] ?? '';

  const fetchData = useCallback(
    async (currentFilters: AttendanceFilters) => {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, chart] = await Promise.all([
          getAttendanceSummaries(currentFilters),
          getChartData(currentFilters),
        ]);
        setSummaries(summaryData);
        setChartData(chart);
      } catch (err) {
        const e = err as Error;
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [setSummaries, setChartData, setLoading, setError]
  );

  useEffect(() => {
    void fetchData(filters);
  }, [filters, fetchData]);

  const totalStats = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        present: acc.present + s.totalPresent,
        late: acc.late + s.totalLate,
        absent: acc.absent + s.totalAbsent,
        leave: acc.leave + s.totalLeave,
      }),
      { present: 0, late: 0, absent: 0, leave: 0 }
    );
  }, [summaries]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filename = generateFilename({
        startDate: filters.startDate,
        endDate: filters.endDate,
        department: filters.department,
      });
      await exportToExcel({
        startDate: filters.startDate,
        endDate: filters.endDate,
        department: filters.department,
        filename,
      });
    } catch (err) {
      const e = err as Error;
      console.error('Export failed:', e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const chartColors = {
    present: '#22c55e',
    late: '#f59e0b',
    absent: '#ef4444',
    leave: '#6366f1',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Laporan Kehadiran
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            Rekap dan analisis kehadiran karyawan
          </p>
        </div>
        <Button
          onClick={() => void handleExport()}
          isLoading={isExporting}
          leftIcon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          }
        >
          Ekspor Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--color-text-tertiary)]">Tanggal Mulai</label>
          <input
            type="date"
            value={filters.startDate}
            max={filters.endDate}
            onChange={(e) => setFilters({ startDate: e.target.value })}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--color-text-tertiary)]">Tanggal Selesai</label>
          <input
            type="date"
            value={filters.endDate}
            min={filters.startDate}
            max={today}
            onChange={(e) => setFilters({ endDate: e.target.value })}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--color-text-tertiary)]">Departemen</label>
          <select
            value={filters.department ?? 'all'}
            onChange={(e) =>
              setFilters({ department: e.target.value === 'all' ? undefined : e.target.value })
            }
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d === 'all' ? 'Semua Departemen' : d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilters({ startDate: thirtyDaysAgo, endDate: today, department: undefined })}
          >
            Reset Filter
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={96} className="w-full" rounded="lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Hadir" value={totalStats.present} color="text-green-600" />
          <StatCard label="Total Terlambat" value={totalStats.late} color="text-yellow-600" />
          <StatCard label="Total Tidak Hadir" value={totalStats.absent} color="text-red-600" />
          <StatCard label="Total Izin" value={totalStats.leave} color="text-indigo-600" />
        </div>
      )}

      {/* Chart */}
      {!isLoading && chartData.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            Grafik Kehadiran Harian
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return format(d, 'd/M', { locale: idLocale });
                }}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
                labelFormatter={(label: string) =>
                  format(new Date(label), 'EEEE, d MMMM yyyy', { locale: idLocale })
                }
              />
              <Legend />
              <Bar dataKey="present" name="Hadir" fill={chartColors.present} radius={[2, 2, 0, 0]} />
              <Bar dataKey="late" name="Terlambat" fill={chartColors.late} radius={[2, 2, 0, 0]} />
              <Bar dataKey="absent" name="Tidak Hadir" fill={chartColors.absent} radius={[2, 2, 0, 0]} />
              <Bar dataKey="leave" name="Izin" fill={chartColors.leave} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Rekap per Karyawan
          </h2>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={48} className="w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-[var(--color-text-tertiary)]">{error}</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => void fetchData(filters)}
            >
              Coba Lagi
            </Button>
          </div>
        ) : summaries.length === 0 ? (
          <EmptyState
            title="Tidak ada data"
            description="Tidak ada data kehadiran untuk periode yang dipilih."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="bg-[var(--color-bg-secondary)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Karyawan</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Departemen</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--color-text-secondary)]">Hadir</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--color-text-secondary)]">Terlambat</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--color-text-secondary)]">Tidak Hadir</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--color-text-secondary)]">Izin</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--color-text-secondary)]">% Kehadiran</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr
                    key={s.employee.id}
                    className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-text-primary)]">{s.employee.fullName}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">{s.employee.nik}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{s.employee.department}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-green-600">{s.totalPresent}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-yellow-600">{s.totalLate}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-red-600">{s.totalAbsent}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-indigo-600">{s.totalLeave}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 rounded-full bg-[var(--color-bg-tertiary)] h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${s.attendancePercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">
                          {s.attendancePercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSummary(s)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DailyDetailModal
        summary={selectedSummary}
        onClose={() => setSelectedSummary(null)}
      />
    </div>
  );
}
