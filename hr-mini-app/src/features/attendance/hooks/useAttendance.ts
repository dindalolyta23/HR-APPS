import { useCallback, useEffect } from 'react';
import { useAttendanceStore } from '../store/attendanceStore';
import {
  getAttendanceRecords,
  getAttendanceStats,
  processScan,
} from '../services/attendanceService';
import { useUIStore } from '@shared/stores/uiStore';
import type { AttendanceFilters } from '@shared/types';

export function useAttendance(autoFetch = false) {
  const addNotification = useUIStore((s) => s.addNotification);
  const {
    records,
    todayScan,
    filters,
    isLoading,
    isScanLoading,
    error,
    setRecords,
    setTodayScan,
    setFilters,
    setLoading,
    setScanLoading,
    setError,
  } = useAttendanceStore();

  const fetchRecords = useCallback(
    async (overrideFilters?: Partial<AttendanceFilters>) => {
      setLoading(true);
      setError(null);
      try {
        const effectiveFilters = { ...filters, ...overrideFilters };
        const data = await getAttendanceRecords(effectiveFilters);
        setRecords(data);
      } catch (err) {
        const e = err as Error;
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [filters, setRecords, setLoading, setError]
  );

  useEffect(() => {
    if (autoFetch) {
      void fetchRecords();
    }
  }, [fetchRecords, autoFetch]);

  const fetchStats = useCallback(
    async (overrideFilters?: Partial<AttendanceFilters>) => {
      const effectiveFilters = { ...filters, ...overrideFilters };
      return getAttendanceStats(effectiveFilters);
    },
    [filters]
  );

  const handleScan = useCallback(
    async (token: string) => {
      setScanLoading(true);
      try {
        const result = await processScan(token);
        setTodayScan(result);
        if (result.success) {
          addNotification({ type: 'success', title: result.message, duration: 3000 });
        }
        return result;
      } catch (err) {
        const e = err as Error;
        addNotification({ type: 'error', title: e.message });
        throw err;
      } finally {
        setScanLoading(false);
      }
    },
    [addNotification, setTodayScan, setScanLoading]
  );

  return {
    records,
    todayScan,
    filters,
    isLoading,
    isScanLoading,
    error,
    setFilters,
    refetch: fetchRecords,
    fetchStats,
    scan: handleScan,
    clearScan: () => setTodayScan(null),
  };
}
