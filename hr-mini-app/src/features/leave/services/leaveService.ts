import type { CorrectionRecord, LeaveRecord } from '@shared/types';
import { supabase } from '@/lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLeave(row: any): LeaveRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.date,
    reason: row.reason,
    submittedBy: row.submitted_by,
    submittedAt: new Date(row.submitted_at),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCorrection(row: any): CorrectionRecord {
  return {
    id: row.id,
    attendanceRecordId: row.attendance_record_id,
    employeeId: row.employee_id,
    date: row.date,
    originalCheckIn: row.original_check_in ? new Date(row.original_check_in) : null,
    originalCheckOut: row.original_check_out ? new Date(row.original_check_out) : null,
    correctedCheckIn: row.corrected_check_in ? new Date(row.corrected_check_in) : null,
    correctedCheckOut: row.corrected_check_out ? new Date(row.corrected_check_out) : null,
    reason: row.reason,
    correctedBy: row.corrected_by,
    correctedAt: new Date(row.corrected_at),
  };
}

/**
 * Fetches leave records, optionally filtered by employee.
 */
export async function getLeaveRecords(employeeId?: string): Promise<LeaveRecord[]> {
  let query = supabase
    .from('leave_records')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapLeave);
}

/**
 * Submits a leave request for an employee.
 */
export async function submitLeave(payload: {
  employeeId: string;
  date: string;
  reason: string;
  submittedBy: string;
}): Promise<LeaveRecord> {
  if (!payload.reason.trim() || payload.reason.trim().length < 10) {
    const err = new Error('Alasan minimal 10 karakter.') as Error & { field?: string };
    err.field = 'reason';
    throw err;
  }

  // Insert leave record
  const { data: newLeave, error: leaveError } = await supabase
    .from('leave_records')
    .insert({
      employee_id: payload.employeeId,
      date: payload.date,
      reason: payload.reason.trim(),
      submitted_by: payload.submittedBy,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (leaveError) throw new Error(leaveError.message);

  // Upsert attendance record with leave status
  const { error: upsertError } = await supabase
    .from('attendance_records')
    .upsert(
      {
        employee_id: payload.employeeId,
        date: payload.date,
        check_in_time: null,
        check_out_time: null,
        work_duration_minutes: null,
        status: 'leave',
        session_id: null,
        is_manual_correction: false,
        leave_id: newLeave.id,
      },
      { onConflict: 'employee_id,date' }
    );

  if (upsertError) throw new Error(upsertError.message);

  return mapLeave(newLeave);
}

/**
 * Fetches correction records, optionally filtered by employee.
 */
export async function getCorrectionRecords(employeeId?: string): Promise<CorrectionRecord[]> {
  let query = supabase
    .from('correction_records')
    .select('*')
    .order('corrected_at', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCorrection);
}

/**
 * Submits an attendance correction.
 */
export async function submitCorrection(payload: {
  attendanceRecordId: string;
  employeeId: string;
  date: string;
  correctedCheckIn: Date | null;
  correctedCheckOut: Date | null;
  reason: string;
  correctedBy: string;
}): Promise<CorrectionRecord> {
  if (!payload.reason.trim() || payload.reason.trim().length < 5) {
    const err = new Error('Alasan minimal 5 karakter.') as Error & { field?: string };
    err.field = 'reason';
    throw err;
  }

  // Fetch original attendance record
  const { data: record } = await supabase
    .from('attendance_records')
    .select('check_in_time, check_out_time')
    .eq('id', payload.attendanceRecordId)
    .maybeSingle();

  // Insert correction record
  const { data: newCorrection, error: corrError } = await supabase
    .from('correction_records')
    .insert({
      attendance_record_id: payload.attendanceRecordId,
      employee_id: payload.employeeId,
      date: payload.date,
      original_check_in: record?.check_in_time ?? null,
      original_check_out: record?.check_out_time ?? null,
      corrected_check_in: payload.correctedCheckIn?.toISOString() ?? null,
      corrected_check_out: payload.correctedCheckOut?.toISOString() ?? null,
      reason: payload.reason.trim(),
      corrected_by: payload.correctedBy,
      corrected_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (corrError) throw new Error(corrError.message);

  // Apply correction to attendance record
  if (payload.attendanceRecordId) {
    let workDuration: number | null = null;
    if (payload.correctedCheckIn && payload.correctedCheckOut) {
      workDuration = Math.floor(
        (payload.correctedCheckOut.getTime() - payload.correctedCheckIn.getTime()) / 60000
      );
    }

    const { error: updateError } = await supabase
      .from('attendance_records')
      .update({
        check_in_time: payload.correctedCheckIn?.toISOString() ?? null,
        check_out_time: payload.correctedCheckOut?.toISOString() ?? null,
        work_duration_minutes: workDuration,
        is_manual_correction: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.attendanceRecordId);

    if (updateError) throw new Error(updateError.message);
  }

  return mapCorrection(newCorrection);
}
