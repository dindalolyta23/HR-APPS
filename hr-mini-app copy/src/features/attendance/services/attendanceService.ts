import type { AttendanceFilters, AttendanceRecord, AttendanceStatus, ScanResult } from '@shared/types';
import { supabase } from '@/lib/supabase';
import { decodeQRToken } from '@features/employees/services/qrService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecord(row: any): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.date,
    checkInTime: row.check_in_time ? new Date(row.check_in_time) : null,
    checkOutTime: row.check_out_time ? new Date(row.check_out_time) : null,
    workDuration: row.work_duration_minutes ?? null,
    status: row.status as AttendanceStatus,
    sessionId: row.session_id ?? null,
    isManualCorrection: row.is_manual_correction ?? false,
    leaveId: row.leave_id ?? null,
  };
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

/**
 * Processes a QR code scan for attendance.
 */
export async function processScan(token: string): Promise<ScanResult> {
  const today = getTodayString();
  const now = new Date();

  // Decode token
  let payload: { employeeId: string; nik: string; issuedAt: number; version: number };
  try {
    payload = decodeQRToken(token);
  } catch {
    return {
      success: false,
      type: 'invalid',
      message: 'QR Code tidak valid atau sudah kadaluarsa.',
    };
  }

  // Find employee
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, full_name, status, qr_token, nik')
    .eq('id', payload.employeeId)
    .single();

  if (empError || !employee) {
    return {
      success: false,
      type: 'invalid',
      message: 'Karyawan tidak ditemukan.',
    };
  }

  if (employee.status === 'inactive') {
    return {
      success: false,
      type: 'inactive',
      employeeName: employee.full_name as string,
      message: `${employee.full_name} sudah tidak aktif dan tidak dapat melakukan absensi.`,
    };
  }

  // Verify token matches current employee token
  if (employee.qr_token !== token) {
    return {
      success: false,
      type: 'invalid',
      message: 'QR Code sudah tidak berlaku. Gunakan QR Code terbaru.',
    };
  }

  // Find existing record for today
  const { data: existingRecord } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .maybeSingle();

  // Fetch active sessions
  const { data: sessions } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('is_active', true);

  const checkInSession = (sessions ?? []).find((s) => s.type === 'check-in');
  const checkOutSession = (sessions ?? []).find((s) => s.type === 'check-out');

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  if (!existingRecord) {
    // New check-in
    const lateThreshold = checkInSession
      ? (() => {
          const [sh, sm] = (checkInSession.start_time as string).split(':').map(Number);
          return (sh ?? 7) * 60 + (sm ?? 0) + ((checkInSession.late_tolerance_minutes as number) ?? 15);
        })()
      : 7 * 60 + 15;

    const status: AttendanceStatus = currentTimeMinutes > lateThreshold ? 'late' : 'present';

    const { error: insertError } = await supabase
      .from('attendance_records')
      .insert({
        employee_id: employee.id,
        date: today,
        check_in_time: now.toISOString(),
        check_out_time: null,
        work_duration_minutes: null,
        status,
        session_id: checkInSession?.id ?? null,
        is_manual_correction: false,
        leave_id: null,
      });

    if (insertError) {
      return {
        success: false,
        type: 'invalid',
        message: 'Gagal menyimpan absensi: ' + insertError.message,
      };
    }

    return {
      success: true,
      type: 'check-in',
      employeeName: employee.full_name as string,
      timestamp: now,
      status,
      message:
        status === 'late'
          ? `${employee.full_name} berhasil absen masuk (Terlambat).`
          : `${employee.full_name} berhasil absen masuk.`,
    };
  }

  // Existing record
  if (existingRecord.check_in_time && existingRecord.check_out_time) {
    return {
      success: false,
      type: 'duplicate',
      employeeName: employee.full_name as string,
      timestamp: now,
      message: `${employee.full_name} sudah melakukan absensi masuk dan keluar hari ini.`,
    };
  }

  if (existingRecord.check_in_time && !existingRecord.check_out_time) {
    // Check-out
    const checkInMs = new Date(existingRecord.check_in_time as string).getTime();
    const workDuration = Math.floor((now.getTime() - checkInMs) / 60000);

    const { error: updateError } = await supabase
      .from('attendance_records')
      .update({
        check_out_time: now.toISOString(),
        work_duration_minutes: workDuration,
        session_id: checkOutSession?.id ?? existingRecord.session_id,
        updated_at: now.toISOString(),
      })
      .eq('id', existingRecord.id);

    if (updateError) {
      return {
        success: false,
        type: 'invalid',
        message: 'Gagal menyimpan absensi keluar: ' + updateError.message,
      };
    }

    return {
      success: true,
      type: 'check-out',
      employeeName: employee.full_name as string,
      timestamp: now,
      status: existingRecord.status as AttendanceStatus,
      message: `${employee.full_name} berhasil absen keluar. Durasi kerja: ${Math.floor(workDuration / 60)}j ${workDuration % 60}m.`,
    };
  }

  return {
    success: false,
    type: 'duplicate',
    employeeName: employee.full_name as string,
    message: `${employee.full_name} sudah melakukan absensi hari ini.`,
  };
}

/**
 * Fetches attendance records with filters.
 */
export async function getAttendanceRecords(
  filters: AttendanceFilters
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from('attendance_records')
    .select('*')
    .gte('date', filters.startDate)
    .lte('date', filters.endDate)
    .order('date', { ascending: false });

  if (filters.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Department filter requires a join — fetch employee IDs first
  if (filters.department && filters.department !== 'all') {
    const { data: empIds } = await supabase
      .from('employees')
      .select('id')
      .eq('department', filters.department);

    const ids = (empIds ?? []).map((e) => e.id as string);
    if (ids.length === 0) return [];
    query = query.in('employee_id', ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapRecord);
}

/**
 * Fetches attendance statistics.
 */
export async function getAttendanceStats(filters: Partial<AttendanceFilters>): Promise<{
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalLeave: number;
  attendanceRate: number;
}> {
  let query = supabase
    .from('attendance_records')
    .select('status, employee_id');

  if (filters.startDate) query = query.gte('date', filters.startDate);
  if (filters.endDate) query = query.lte('date', filters.endDate);

  if (filters.department && filters.department !== 'all') {
    const { data: empIds } = await supabase
      .from('employees')
      .select('id')
      .eq('department', filters.department);

    const ids = (empIds ?? []).map((e) => e.id as string);
    if (ids.length === 0) {
      return { totalPresent: 0, totalLate: 0, totalAbsent: 0, totalLeave: 0, attendanceRate: 0 };
    }
    query = query.in('employee_id', ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const records = data ?? [];
  const totalPresent = records.filter((r) => r.status === 'present').length;
  const totalLate = records.filter((r) => r.status === 'late').length;
  const totalAbsent = records.filter((r) => r.status === 'absent').length;
  const totalLeave = records.filter((r) => r.status === 'leave').length;
  const total = totalPresent + totalLate + totalAbsent + totalLeave;
  const attendanceRate = total > 0 ? Math.round(((totalPresent + totalLate) / total) * 100) : 0;

  return { totalPresent, totalLate, totalAbsent, totalLeave, attendanceRate };
}

/**
 * Returns all attendance records from Supabase (for use by other services).
 * Note: This is async — callers should await it.
 */
export async function getAttendanceStore(): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRecord);
}
