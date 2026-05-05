import { create } from 'zustand';
import type { AttendanceFilters, EmployeeAttendanceSummary } from '@shared/types';

export interface ChartDataPoint {
  date: string;
  present: number;
  late: number;
  absent: number;
  leave: number;
}

export interface ReportSummary {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalLeave: number;
  attendanceRate: number; // 0–100
}

interface ReportState {
  summary: ReportSummary | null;
  summaries: EmployeeAttendanceSummary[];
  chartData: ChartDataPoint[];
  filters: AttendanceFilters;
  isLoading: boolean;
  error: string | null;
}

interface ReportActions {
  setSummary: (summary: ReportSummary | null) => void;
  setSummaries: (summaries: EmployeeAttendanceSummary[]) => void;
  setChartData: (data: ChartDataPoint[]) => void;
  setFilters: (filters: Partial<AttendanceFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type ReportStore = ReportState & ReportActions;

const today = new Date().toISOString().split('T')[0] ?? '';
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0] ?? '';

const initialState: ReportState = {
  summary: null,
  summaries: [],
  chartData: [],
  filters: {
    startDate: thirtyDaysAgo,
    endDate: today,
  },
  isLoading: false,
  error: null,
};

export const useReportStore = create<ReportStore>()((set) => ({
  ...initialState,

  setSummary: (summary) => set({ summary }),
  setSummaries: (summaries) => set({ summaries }),
  setChartData: (chartData) => set({ chartData }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
