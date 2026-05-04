import { useCallback, useEffect } from 'react';
import { useReportStore } from '../store/reportStore';
import { getAttendanceSummaries, getChartData } from '../services/reportService';
import { exportToExcel, generateFilename } from '../services/exportService';
import { useUIStore } from '@shared/stores/uiStore';
import type { AttendanceFilters } from '@shared/types';

export function useReports(autoFetch = true) {
  const addNotification = useUIStore((s) => s.addNotification);
  const {
    summary,
    summaries,
    chartData,
    filters,
    isLoading,
    error,
    setSummaries,
    setChartData,
    setFilters,
    setLoading,
    setError,
  } = useReportStore();

  const fetchData = useCallback(
    async (overrideFilters?: Partial<AttendanceFilters>) => {
      const effectiveFilters = { ...filters, ...overrideFilters };
      setLoading(true);
      setError(null);
      try {
        const [summaryData, chart] = await Promise.all([
          getAttendanceSummaries(effectiveFilters),
          getChartData(effectiveFilters),
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
    [filters, setSummaries, setChartData, setLoading, setError]
  );

  useEffect(() => {
    if (autoFetch) {
      void fetchData();
    }
  }, [fetchData, autoFetch]);

  const handleExport = useCallback(async () => {
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
      addNotification({ type: 'success', title: 'Ekspor berhasil.' });
    } catch (err) {
      const e = err as Error;
      addNotification({ type: 'error', title: `Ekspor gagal: ${e.message}` });
    }
  }, [filters, addNotification]);

  const totalStats = summaries.reduce(
    (acc, s) => ({
      present: acc.present + s.totalPresent,
      late: acc.late + s.totalLate,
      absent: acc.absent + s.totalAbsent,
      leave: acc.leave + s.totalLeave,
    }),
    { present: 0, late: 0, absent: 0, leave: 0 }
  );

  return {
    summary,
    summaries,
    chartData,
    filters,
    isLoading,
    error,
    totalStats,
    setFilters,
    refetch: fetchData,
    exportToExcel: handleExport,
  };
}
