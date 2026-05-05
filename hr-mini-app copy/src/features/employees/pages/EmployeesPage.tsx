import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '../store/employeeStore';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
} from '../services/employeeService';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import { Modal } from '@shared/components/ui/Modal';
import { Badge } from '@shared/components/ui/Badge';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { EmptyState } from '@shared/components/feedback/EmptyState';
import { useUIStore } from '@shared/stores/uiStore';
import { useDebounce } from '@shared/hooks/useDebounce';
import type { CreateEmployeePayload, Employee, UpdateEmployeePayload } from '@shared/types';

import { AvatarUpload } from '@shared/components/ui/AvatarUpload';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations'];

interface EmployeeFormData {
  nik: string;
  fullName: string;
  department: string;
  position: string;
  status?: 'active' | 'inactive';
  avatarUrl?: string;
}

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess: () => void;
}

function EmployeeFormModal({ isOpen, onClose, employee, onSuccess }: EmployeeFormModalProps) {
  const addNotification = useUIStore((s) => s.addNotification);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<EmployeeFormData>>({});
  const [form, setForm] = useState<EmployeeFormData>({
    nik: '',
    fullName: '',
    department: DEPARTMENTS[0] ?? '',
    position: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (employee) {
      setForm({
        nik: employee.nik,
        fullName: employee.fullName,
        department: employee.department,
        position: employee.position,
        status: employee.status,
        avatarUrl: (employee as Employee & { avatarUrl?: string }).avatarUrl ?? '',
      });
    } else {
      setForm({ nik: '', fullName: '', department: DEPARTMENTS[0] ?? '', position: '', avatarUrl: '' });
    }
    setErrors({});
  }, [employee, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<EmployeeFormData> = {};
    if (!form.nik.trim()) newErrors.nik = 'NIK wajib diisi.';
    if (!form.fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi.';
    if (!form.department) newErrors.department = 'Departemen wajib dipilih.';
    if (!form.position.trim()) newErrors.position = 'Jabatan wajib diisi.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (employee) {
        const payload: UpdateEmployeePayload = {
          fullName: form.fullName,
          department: form.department,
          position: form.position,
          status: form.status,
        };
        await updateEmployee(employee.id, payload);
        addNotification({ type: 'success', title: 'Karyawan berhasil diperbarui.' });
      } else {
        const payload: CreateEmployeePayload = {
          nik: form.nik,
          fullName: form.fullName,
          department: form.department,
          position: form.position,
        };
        await createEmployee(payload);
        addNotification({ type: 'success', title: 'Karyawan berhasil ditambahkan.' });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as Error & { field?: string };
      if (error.field === 'nik') {
        setErrors((prev) => ({ ...prev, nik: error.message }));
      } else {
        addNotification({ type: 'error', title: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? 'Edit Karyawan' : 'Tambah Karyawan'}
      size="md"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {/* Avatar Upload */}
        <div className="flex justify-center">
          <AvatarUpload
            currentUrl={form.avatarUrl}
            employeeId={employee?.id}
            onUploaded={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
          />
        </div>

        <Input
          label="NIK"
          value={form.nik}
          onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))}
          error={errors.nik}
          disabled={!!employee}
          placeholder="Contoh: ENG001"
          required
          fullWidth
        />
        <Input
          label="Nama Lengkap"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          error={errors.fullName}
          placeholder="Nama lengkap karyawan"
          required
          fullWidth
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">
            Departemen <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.department && (
            <p className="text-xs text-red-600">{errors.department}</p>
          )}
        </div>
        <Input
          label="Jabatan"
          value={form.position}
          onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
          error={errors.position}
          placeholder="Contoh: Software Engineer"
          required
          fullWidth
        />
        {employee && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {employee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function EmployeesPage() {
  const navigate = useNavigate();
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

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

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
  }, [filters, debouncedSearch, pagination.page, pagination.pageSize, setEmployees, setFilters, setPagination, setLoading, setError]);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  const handleDeactivate = async (id: string) => {
    setDeactivatingId(id);
    try {
      await deactivateEmployee(id);
      addNotification({ type: 'success', title: 'Karyawan berhasil dinonaktifkan.' });
      void fetchEmployees();
    } catch (err) {
      const e = err as Error;
      addNotification({ type: 'error', title: e.message });
    } finally {
      setDeactivatingId(null);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Manajemen Karyawan
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {pagination.total} karyawan terdaftar
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEmployee(null);
            setIsFormOpen(true);
          }}
          leftIcon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Tambah Karyawan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cari nama, NIK, departemen..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-64"
          leftAddon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <select
          value={filters.department ?? 'all'}
          onChange={(e) => {
            setFilters({ department: e.target.value === 'all' ? undefined : e.target.value });
            setPagination({ page: 1 });
          }}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter departemen"
        >
          <option value="all">Semua Departemen</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filters.status ?? 'all'}
          onChange={(e) => {
            setFilters({ status: e.target.value as 'active' | 'inactive' | 'all' });
            setPagination({ page: 1 });
          }}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter status"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={48} className="w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-[var(--color-text-tertiary)]">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => void fetchEmployees()}>
              Coba Lagi
            </Button>
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            title="Tidak ada karyawan"
            description="Belum ada karyawan yang sesuai dengan filter yang dipilih."
            action={
              <Button onClick={() => { setEditingEmployee(null); setIsFormOpen(true); }}>
                Tambah Karyawan
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">NIK</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Nama</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Departemen</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Jabatan</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[var(--color-text-secondary)]">{emp.nik}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void navigate(`/employees/${emp.id}`)}
                        className="font-medium text-blue-600 hover:underline text-left"
                      >
                        {emp.fullName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{emp.department}</td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">{emp.position}</td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.status === 'active' ? 'success' : 'default'}>
                        {emp.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void navigate(`/employees/${emp.id}`)}
                          aria-label={`Lihat detail ${emp.fullName}`}
                        >
                          Detail
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEmployee(emp);
                            setIsFormOpen(true);
                          }}
                          aria-label={`Edit ${emp.fullName}`}
                        >
                          Edit
                        </Button>
                        {emp.status === 'active' && (
                          <Button
                            variant="danger"
                            size="sm"
                            isLoading={deactivatingId === emp.id}
                            onClick={() => void handleDeactivate(emp.id)}
                            aria-label={`Nonaktifkan ${emp.fullName}`}
                          >
                            Nonaktifkan
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Halaman {pagination.page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ page: pagination.page - 1 })}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => setPagination({ page: pagination.page + 1 })}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employee={editingEmployee}
        onSuccess={() => void fetchEmployees()}
      />
    </div>
  );
}
