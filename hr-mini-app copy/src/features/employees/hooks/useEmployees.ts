import { useCallback, useEffect, useState } from 'react';
import { useEmployeeStore } from '../store/employeeStore';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from '../services/employeeService';
import { useUIStore } from '@shared/stores/uiStore';
import { useDebounce } from '@shared/hooks/useDebounce';
import type { CreateEmployeePayload, Employee, UpdateEmployeePayload } from '@shared/types';

export function useEmployees(autoFetch = true) {
  const addNotification = useUIStore((s) => s.addNotification);
  const {
    employees,
    filters,
    pagination,
    isLoading,
    error,
    setEmployees,
    setFilters,
    setPagination,
    setLoading,
    setError,
  } = useEmployeeStore();

  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const debouncedSearch = useDebounce(searchInput, 400);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEmployees({
        department: filters.department,
        status: filters.status,
        search: debouncedSearch || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setEmployees(result.data);
      setPagination({ total: result.total });
    } catch (err) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [
    filters.department,
    filters.status,
    debouncedSearch,
    pagination.page,
    pagination.pageSize,
    setEmployees,
    setPagination,
    setLoading,
    setError,
  ]);

  useEffect(() => {
    if (autoFetch) {
      void fetchEmployees();
    }
  }, [fetchEmployees, autoFetch]);

  const handleCreate = useCallback(
    async (payload: CreateEmployeePayload): Promise<Employee> => {
      const emp = await createEmployee(payload);
      addNotification({ type: 'success', title: 'Karyawan berhasil ditambahkan.' });
      void fetchEmployees();
      return emp;
    },
    [addNotification, fetchEmployees]
  );

  const handleUpdate = useCallback(
    async (id: string, payload: UpdateEmployeePayload): Promise<Employee> => {
      const emp = await updateEmployee(id, payload);
      addNotification({ type: 'success', title: 'Karyawan berhasil diperbarui.' });
      void fetchEmployees();
      return emp;
    },
    [addNotification, fetchEmployees]
  );

  const handleDeactivate = useCallback(
    async (id: string): Promise<Employee> => {
      const emp = await deactivateEmployee(id);
      addNotification({ type: 'success', title: 'Karyawan berhasil dinonaktifkan.' });
      void fetchEmployees();
      return emp;
    },
    [addNotification, fetchEmployees]
  );

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return {
    employees,
    filters,
    pagination,
    totalPages,
    isLoading,
    error,
    searchInput,
    setSearchInput,
    setFilters: (f: Parameters<typeof setFilters>[0]) => {
      setFilters(f);
      setPagination({ page: 1 });
    },
    setPagination,
    refetch: fetchEmployees,
    createEmployee: handleCreate,
    updateEmployee: handleUpdate,
    deactivateEmployee: handleDeactivate,
  };
}
