import { useCallback, useEffect } from 'react';
import { useScheduleStore } from '../store/scheduleStore';
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getHolidays,
  addHoliday,
  deleteHoliday,
  getWorkdayConfig,
  updateWorkdayConfig,
} from '../services/scheduleService';
import { useUIStore } from '@shared/stores/uiStore';
import type { AttendanceSession, DayOfWeek, Holiday } from '@shared/types';

export function useSchedule(autoFetch = true) {
  const addNotification = useUIStore((s) => s.addNotification);
  const {
    sessions,
    holidays,
    workdayConfig,
    isLoading,
    error,
    setSessions,
    setHolidays,
    setWorkdayConfig,
    setLoading,
    setError,
  } = useScheduleStore();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h, w] = await Promise.all([
        getSessions(),
        getHolidays(),
        getWorkdayConfig(),
      ]);
      setSessions(s);
      setHolidays(h);
      setWorkdayConfig(w);
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      addNotification({ type: 'error', title: 'Gagal memuat data jadwal.' });
    } finally {
      setLoading(false);
    }
  }, [setSessions, setHolidays, setWorkdayConfig, setLoading, setError, addNotification]);

  useEffect(() => {
    if (autoFetch) {
      void fetchAll();
    }
  }, [fetchAll, autoFetch]);

  const handleCreateSession = useCallback(
    async (session: Omit<AttendanceSession, 'id'>): Promise<AttendanceSession> => {
      const newSession = await createSession(session);
      addNotification({ type: 'success', title: 'Sesi berhasil ditambahkan.' });
      void fetchAll();
      return newSession;
    },
    [addNotification, fetchAll]
  );

  const handleUpdateSession = useCallback(
    async (id: string, session: Partial<AttendanceSession>): Promise<AttendanceSession> => {
      const updated = await updateSession(id, session);
      addNotification({ type: 'success', title: 'Sesi berhasil diperbarui.' });
      void fetchAll();
      return updated;
    },
    [addNotification, fetchAll]
  );

  const handleDeleteSession = useCallback(
    async (id: string): Promise<void> => {
      await deleteSession(id);
      addNotification({ type: 'success', title: 'Sesi berhasil dihapus.' });
      void fetchAll();
    },
    [addNotification, fetchAll]
  );

  const handleAddHoliday = useCallback(
    async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => {
      const newHoliday = await addHoliday(holiday);
      addNotification({ type: 'success', title: 'Hari libur berhasil ditambahkan.' });
      void fetchAll();
      return newHoliday;
    },
    [addNotification, fetchAll]
  );

  const handleDeleteHoliday = useCallback(
    async (id: string): Promise<void> => {
      await deleteHoliday(id);
      addNotification({ type: 'success', title: 'Hari libur berhasil dihapus.' });
      void fetchAll();
    },
    [addNotification, fetchAll]
  );

  const handleUpdateWorkdays = useCallback(
    async (workDays: DayOfWeek[]): Promise<void> => {
      await updateWorkdayConfig({ workDays });
      setWorkdayConfig({ workDays });
      addNotification({ type: 'success', title: 'Konfigurasi hari kerja berhasil disimpan.' });
    },
    [addNotification, setWorkdayConfig]
  );

  return {
    sessions,
    holidays,
    workdayConfig,
    isLoading,
    error,
    refetch: fetchAll,
    createSession: handleCreateSession,
    updateSession: handleUpdateSession,
    deleteSession: handleDeleteSession,
    addHoliday: handleAddHoliday,
    deleteHoliday: handleDeleteHoliday,
    updateWorkdays: handleUpdateWorkdays,
  };
}
