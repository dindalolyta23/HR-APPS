import { create } from 'zustand';
import type { AttendanceFilters, AttendanceRecord, ScanResult } from '@shared/types';

interface AttendanceState {
  records: AttendanceRecord[];
  todayScan: ScanResult | null;
  filters: AttendanceFilters;
  isLoading: boolean;
  isScanLoading: boolean;
  error: string | null;
}

interface AttendanceActions {
  setRecords: (records: AttendanceRecord[]) => void;
  addRecord: (record: AttendanceRecord) => void;
  updateRecord: (id: string, updates: Partial<AttendanceRecord>) => void;
  setTodayScan: (result: ScanResult | null) => void;
  setFilters: (filters: Partial<AttendanceFilters>) => void;
  setLoading: (loading: boolean) => void;
  setScanLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type AttendanceStore = AttendanceState & AttendanceActions;

const today = new Date().toISOString().split('T')[0] ?? '';

const initialState: AttendanceState = {
  records: [],
  todayScan: null,
  filters: {
    startDate: today,
    endDate: today,
  },
  isLoading: false,
  isScanLoading: false,
  error: null,
};

export const useAttendanceStore = create<AttendanceStore>()((set) => ({
  ...initialState,

  setRecords: (records) => set({ records }),
  addRecord: (record) =>
    set((state) => ({ records: [...state.records, record] })),
  updateRecord: (id, updates) =>
    set((state) => ({
      records: state.records.map((rec) =>
        rec.id === id ? { ...rec, ...updates } : rec
      ),
    })),
  setTodayScan: (todayScan) => set({ todayScan }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setLoading: (isLoading) => set({ isLoading }),
  setScanLoading: (isScanLoading) => set({ isScanLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
