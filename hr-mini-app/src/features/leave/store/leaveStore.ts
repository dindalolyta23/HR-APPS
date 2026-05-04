import { create } from 'zustand';
import type { CorrectionRecord, LeaveRecord } from '@shared/types';

interface LeaveState {
  leaveRequests: LeaveRecord[];
  corrections: CorrectionRecord[];
  auditLog: Array<LeaveRecord | CorrectionRecord>;
  isLoading: boolean;
  error: string | null;
}

interface LeaveActions {
  setLeaveRequests: (requests: LeaveRecord[]) => void;
  addLeaveRequest: (request: LeaveRecord) => void;
  setCorrections: (corrections: CorrectionRecord[]) => void;
  addCorrection: (correction: CorrectionRecord) => void;
  setAuditLog: (log: Array<LeaveRecord | CorrectionRecord>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type LeaveStore = LeaveState & LeaveActions;

const initialState: LeaveState = {
  leaveRequests: [],
  corrections: [],
  auditLog: [],
  isLoading: false,
  error: null,
};

export const useLeaveStore = create<LeaveStore>()((set) => ({
  ...initialState,

  setLeaveRequests: (leaveRequests) => set({ leaveRequests }),
  addLeaveRequest: (request) =>
    set((state) => ({ leaveRequests: [...state.leaveRequests, request] })),
  setCorrections: (corrections) => set({ corrections }),
  addCorrection: (correction) =>
    set((state) => ({ corrections: [...state.corrections, correction] })),
  setAuditLog: (auditLog) => set({ auditLog }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
