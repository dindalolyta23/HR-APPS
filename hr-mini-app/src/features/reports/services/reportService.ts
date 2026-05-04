import type {
  AttendanceFilters,
  EmployeeAttendanceSummary,
} from '@shared/types';
import type { ChartDataPoint } from '../store/reportStore';
import { supabase } from '@/lib/supabase';

/**
 * Fetches attendance summaries per employee with filters.
 */
export async function getAttendanceSummaries(
  filters: AttendanceFilters
): Promise<EmployeeAttendanceSummary[]> {
  // Build employee query
  let empQuery = supabase
    .from('employees')
    .select('id, nik, full_name, department')
    .eq('status', 'active');

  if (filters.department && filters.department !== 'all') {
    empQuery = empQuery.eq('department', filters.department);
  }

  const { data: employees, error: empError } = await empQuery;
  if (empError) throw new Error(empError.message);

  if (!employees || employees.length === 0) return [];

  const employeeIds = employees.map((e) => e.id as string);

  // Build attendance records query
  let recQuery = supabase
    .from('attendance_records')
    .select('employee_id, status')
    .gte('date', filters.startDate)
    .lte('date', filters.endDate)
    .in('employee_id', employeeIds);

  if (filters.status) {
    recQuery = recQuery.eq('status', filters.status);
  }

  const { data: records, error: recError } = await recQuery;
  if (recError) throw new Error(recError.message);

  // Build summary map
  const summaryMap = new Map<string, EmployeeAttendanceSummary>();

  for (const emp of employees) {
    summaryMap.set(emp.id as string, {
      employee: {
        id: emp.id as string,
        nik: emp.nik as string,
        fullName: emp.full_name as string,
        department: emp.department as string,
      },
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
      totalLeave: 0,
      attendancePercentage: 0,
    });
  }

  for (const record of records ?? []) {
    const summary = summaryMap.get(record.employee_id as string);
    if (!summary) continue;

    switch (record.status) {
      case 'present':
        summary.totalPresent++;
        break;
      case 'late':
        summary.totalLate++;
        break;
      case 'absent':
        summary.totalAbsent++;
        break;
      case 'leave':
        summary.totalLeave++;
        break;
    }
  }

  // Calculate attendance percentage
  for (const summary of summaryMap.values()) {
    const total =
      summary.totalPresent + summary.totalLate + summary.totalAbsent + summary.totalLeave;
    summary.attendancePercentage =
      total > 0
        ? Math.round(((summary.totalPresent + summary.totalLate) / total) * 100)
        : 0;
  }

  return Array.from(summaryMap.values());
}

/**
 * Generates chart data (daily breakdown) for a date range.
 */
export async function getChartData(filters: AttendanceFilters): Promise<ChartDataPoint[]> {
  let query = supabase
    .from('attendance_records')
    .select('date, status, employee_id')
    .gte('date', filters.startDate)
    .lte('date', filters.endDate);

  if (filters.department && filters.department !== 'all') {
    const { data: empIds } = await supabase
      .from('employees')
      .select('id')
      .eq('department', filters.department);

    const ids = (empIds ?? []).map((e) => e.id as string);
    if (ids.length === 0) return [];
    query = query.in('employee_id', ids);
  }

  const { data: records, error } = await query;
  if (error) throw new Error(error.message);

  // Group by date
  const dateMap = new Map<string, ChartDataPoint>();

  for (const record of records ?? []) {
    const date = record.date as string;
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, present: 0, late: 0, absent: 0, leave: 0 });
    }

    const point = dateMap.get(date)!;
    switch (record.status) {
      case 'present':
        point.present++;
        break;
      case 'late':
        point.late++;
        break;
      case 'absent':
        point.absent++;
        break;
      case 'leave':
        point.leave++;
        break;
    }
  }

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}
