import { useCallback, useEffect } from 'react';
import { useLeaveStore } from '../store/leaveStore';
import {
  getLeaveRecords,
  getCorrectionRecords,
  submitLeave,
  submitCorrection,
} from '../services/leaveService';
import { useUIStore } from '@shared/stores/uiStore';
import type { CorrectionRecord, LeaveRecord } from '@shared/types';

export function useLeave(autoFetch = true) {
  const addNotification = useUIStore((s) => s.addNotification);
  const {
    leaveRequests,
    corrections,
    isLoading,
    error,
    setLeaveRequests,
    setCorrections,
    setLoading,
    setError,
  } = useLeaveStore();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leaves, corrs] = await Promise.all([
        getLeaveRecords(),
        getCorrectionRecords(),
      ]);
      setLeaveRequests(leaves);
      setCorrections(corrs);
    } catch (err) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [setLeaveRequests, setCorrections, setLoading, setError]);

  useEffect(() => {
    if (autoFetch) {
      void fetchAll();
    }
  }, [fetchAll, autoFetch]);

  const handleSubmitLeave = useCallback(
    async (payload: {
      employeeId: string;
      date: string;
      reason: string;
      submittedBy: string;
    }): Promise<LeaveRecord> => {
      const leave = await submitLeave(payload);
      addNotification({ type: 'success', title: 'Izin berhasil diajukan.' });
      void fetchAll();
      return leave;
    },
    [addNotification, fetchAll]
  );

  const handleSubmitCorrection = useCallback(
    async (payload: {
      attendanceRecordId: string;
      employeeId: string;
      date: string;
      correctedCheckIn: Date | null;
      correctedCheckOut: Date | null;
      reason: string;
      correctedBy: string;
    }): Promise<CorrectionRecord> => {
      const correction = await submitCorrection(payload);
      addNotification({ type: 'success', title: 'Koreksi berhasil disimpan.' });
      void fetchAll();
      return correction;
    },
    [addNotification, fetchAll]
  );

  return {
    leaveRequests,
    corrections,
    isLoading,
    error,
    refetch: fetchAll,
    submitLeave: handleSubmitLeave,
    submitCorrection: handleSubmitCorrection,
  };
}
