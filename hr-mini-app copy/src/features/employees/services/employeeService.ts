import type {
  CreateEmployeePayload,
  Employee,
  PaginatedResponse,
  UpdateEmployeePayload,
} from '@shared/types';
import { supabase } from '@/lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateQRToken(employeeId: string, nik: string, version = 1): string {
  const payload = { employeeId, nik, issuedAt: Date.now(), version };
  return btoa(JSON.stringify(payload));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEmployee(row: any): Employee {
  return {
    id: row.id,
    nik: row.nik,
    fullName: row.full_name,
    department: row.department,
    position: row.position,
    status: row.status,
    qrToken: row.qr_token ?? '',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface EmployeeQueryParams {
  department?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetches all employees with optional filters.
 */
export async function getEmployees(
  params?: EmployeeQueryParams
): Promise<PaginatedResponse<Employee>> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('employees')
    .select('*', { count: 'exact' });

  if (params?.department && params.department !== 'all') {
    query = query.eq('department', params.department);
  }
  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params?.search) {
    const q = params.search;
    query = query.or(
      `full_name.ilike.%${q}%,nik.ilike.%${q}%,department.ilike.%${q}%,position.ilike.%${q}%`
    );
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []).map(mapEmployee),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Fetches a single employee by ID.
 */
export async function getEmployee(id: string): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error('Karyawan tidak ditemukan.');
  return mapEmployee(data);
}

/**
 * Creates a new employee.
 */
export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  // Check duplicate NIK
  const { data: existing } = await supabase
    .from('employees')
    .select('id')
    .ilike('nik', payload.nik.trim())
    .maybeSingle();

  if (existing) {
    const err = new Error('NIK sudah digunakan oleh karyawan lain.') as Error & { field?: string };
    err.field = 'nik';
    throw err;
  }

  // Insert first to get the generated UUID
  const { data: inserted, error: insertError } = await supabase
    .from('employees')
    .insert({
      nik: payload.nik.trim(),
      full_name: payload.fullName.trim(),
      department: payload.department,
      position: payload.position.trim(),
      status: 'active',
    })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  // Generate QR token using the real UUID
  const qrToken = generateQRToken(inserted.id, payload.nik.trim(), 1);

  const { data: updated, error: updateError } = await supabase
    .from('employees')
    .update({ qr_token: qrToken, qr_version: 1 })
    .eq('id', inserted.id)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  return mapEmployee(updated);
}

/**
 * Updates an existing employee.
 */
export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<Employee> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.fullName !== undefined) updateData.full_name = payload.fullName;
  if (payload.department !== undefined) updateData.department = payload.department;
  if (payload.position !== undefined) updateData.position = payload.position;
  if (payload.status !== undefined) updateData.status = payload.status;

  const { data, error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Karyawan tidak ditemukan.');
  return mapEmployee(data);
}

/**
 * Deactivates an employee.
 */
export async function deactivateEmployee(id: string): Promise<Employee> {
  const { data: existing, error: fetchError } = await supabase
    .from('employees')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error('Karyawan tidak ditemukan.');
  if (existing.status === 'inactive') throw new Error('Karyawan sudah tidak aktif.');

  const { data, error } = await supabase
    .from('employees')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapEmployee(data);
}

/**
 * Returns all employees from Supabase (for use by other services).
 * Note: This is async — callers should await it.
 */
export async function getEmployeesStore(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEmployee);
}
