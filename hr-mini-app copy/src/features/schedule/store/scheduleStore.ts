import { create } from 'zustand';
import type { AttendanceSession, Holiday, WorkdayConfig } from '@shared/types';

interface ScheduleState {
  sessions: AttendanceSession[];
  holidays: Holiday[];
  workdayConfig: WorkdayConfig;
  isLoading: boolean;
  error: string | null;
}

interface ScheduleActions {
  setSessions: (sessions: AttendanceSession[]) => void;
  addSession: (session: AttendanceSession) => void;
  updateSession: (id: string, updates: Partial<AttendanceSession>) => void;
  removeSession: (id: string) => void;
  setHolidays: (holidays: Holiday[]) => void;
  addHoliday: (holiday: Holiday) => void;
  removeHoliday: (id: string) => void;
  setWorkdayConfig: (config: WorkdayConfig) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type ScheduleStore = ScheduleState & ScheduleActions;

const initialState: ScheduleState = {
  sessions: [],
  holidays: [],
  workdayConfig: {
    workDays: [1, 2, 3, 4, 5], // Mon–Fri default
  },
  isLoading: false,
  error: null,
};

export const useScheduleStore = create<ScheduleStore>()((set) => ({
  ...initialState,

  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  removeSession: (id) =>
    set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
  setHolidays: (holidays) => set({ holidays }),
  addHoliday: (holiday) =>
    set((state) => ({ holidays: [...state.holidays, holiday] })),
  removeHoliday: (id) =>
    set((state) => ({ holidays: state.holidays.filter((h) => h.id !== id) })),
  setWorkdayConfig: (workdayConfig) => set({ workdayConfig }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
