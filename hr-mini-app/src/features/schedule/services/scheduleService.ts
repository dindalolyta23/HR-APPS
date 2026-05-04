import type { AttendanceSession, Holiday, WorkdayConfig } from '@shared/types';
import { supabase } from '@/lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(row: any): AttendanceSession {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    startTime: row.start_time,
    endTime: row.end_time,
    lateToleranceMinutes: row.late_tolerance_minutes ?? 0,
    isActive: row.is_active ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHoliday(row: any): Holiday {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    type: row.type,
  };
}

/**
 * Fetches all attendance sessions.
 */
export async function getSessions(): Promise<AttendanceSession[]> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSession);
}

/**
 * Creates a new attendance session.
 * Validates that startTime < endTime.
 */
export async function createSession(
  session: Omit<AttendanceSession, 'id'>
): Promise<AttendanceSession> {
  if (session.startTime >= session.endTime) {
    const err = new Error('Waktu selesai harus lebih dari waktu mulai.') as Error & { field?: string };
    err.field = 'endTime';
    throw err;
  }

  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert({
      name: session.name,
      type: session.type,
      start_time: session.startTime,
      end_time: session.endTime,
      late_tolerance_minutes: session.lateToleranceMinutes,
      is_active: session.isActive,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSession(data);
}

/**
 * Updates an existing session.
 */
export async function updateSession(
  id: string,
  session: Partial<AttendanceSession>
): Promise<AttendanceSession> {
  // Fetch current to validate merged times
  const { data: current, error: fetchError } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error('Sesi tidak ditemukan.');

  const merged = mapSession({ ...current, ...session });
  const startTime = session.startTime ?? merged.startTime;
  const endTime = session.endTime ?? merged.endTime;

  if (startTime >= endTime) {
    const err = new Error('Waktu selesai harus lebih dari waktu mulai.') as Error & { field?: string };
    err.field = 'endTime';
    throw err;
  }

  const updateData: Record<string, unknown> = {};
  if (session.name !== undefined) updateData.name = session.name;
  if (session.type !== undefined) updateData.type = session.type;
  if (session.startTime !== undefined) updateData.start_time = session.startTime;
  if (session.endTime !== undefined) updateData.end_time = session.endTime;
  if (session.lateToleranceMinutes !== undefined) updateData.late_tolerance_minutes = session.lateToleranceMinutes;
  if (session.isActive !== undefined) updateData.is_active = session.isActive;

  const { data, error } = await supabase
    .from('attendance_sessions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSession(data);
}

/**
 * Deletes a session.
 */
export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('attendance_sessions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Fetches all holidays.
 */
export async function getHolidays(): Promise<Holiday[]> {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapHoliday);
}

/**
 * Adds a holiday.
 */
export async function addHoliday(holiday: Omit<Holiday, 'id'>): Promise<Holiday> {
  // Check duplicate date
  const { data: existing } = await supabase
    .from('holidays')
    .select('id')
    .eq('date', holiday.date)
    .maybeSingle();

  if (existing) {
    const err = new Error('Sudah ada hari libur pada tanggal tersebut.') as Error & { field?: string };
    err.field = 'date';
    throw err;
  }

  const { data, error } = await supabase
    .from('holidays')
    .insert({
      date: holiday.date,
      name: holiday.name,
      type: holiday.type,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapHoliday(data);
}

/**
 * Deletes a holiday.
 */
export async function deleteHoliday(id: string): Promise<void> {
  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Fetches workday configuration.
 */
export async function getWorkdayConfig(): Promise<WorkdayConfig> {
  const { data, error } = await supabase
    .from('workday_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(error.message);
  return { workDays: data.work_days };
}

/**
 * Updates workday configuration.
 */
export async function updateWorkdayConfig(config: WorkdayConfig): Promise<WorkdayConfig> {
  // Get the existing config row id
  const { data: existing, error: fetchError } = await supabase
    .from('workday_config')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { data, error } = await supabase
    .from('workday_config')
    .update({ work_days: config.workDays, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { workDays: data.work_days };
}
