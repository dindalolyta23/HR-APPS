import { create } from 'zustand';
import type { Employee, PaginationState } from '@shared/types';

export interface EmployeeFilters {
  department?: string;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
}

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  filters: EmployeeFilters;
  pagination: PaginationState;
  isLoading: boolean;
  error: string | null;
}

interface EmployeeActions {
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  setSelectedEmployee: (employee: Employee | null) => void;
  setFilters: (filters: Partial<EmployeeFilters>) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type EmployeeStore = EmployeeState & EmployeeActions;

const initialState: EmployeeState = {
  employees: [],
  selectedEmployee: null,
  filters: {
    status: 'all',
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  isLoading: false,
  error: null,
};

export const useEmployeeStore = create<EmployeeStore>()((set) => ({
  ...initialState,

  setEmployees: (employees) => set({ employees }),
  addEmployee: (employee) =>
    set((state) => ({ employees: [...state.employees, employee] })),
  updateEmployee: (id, updates) =>
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...updates } : emp
      ),
    })),
  removeEmployee: (id) =>
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
    })),
  setSelectedEmployee: (selectedEmployee) => set({ selectedEmployee }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setPagination: (pagination) =>
    set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
