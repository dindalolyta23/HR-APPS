import { http, HttpResponse } from 'msw';
import { delay } from '../utils/delay';
import { employees } from './employeeHandlers';
import { seedAttendanceRecords, seedHolidays, seedSessions, seedWorkdayConfig } from '../data';
import type { AttendanceRecord, AttendanceStatus, ScanResult } from '@shared/types';

// Mutable in-memory store
let attendanceRecords: AttendanceRecord[] = [...seedAttendanceRecords];

function generateId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isHoliday(dateStr: string): boolean {
  return seedHolidays.some((h) => h.date === dateStr);
}

function isWorkday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const day = d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  return seedWorkdayConfig.workDays.includes(day);
}

function decodeToken(token: string): { employeeId: string; nik: string; version: number } | null {
  try {
    const payload = JSON.parse(atob(token)) as {
      employeeId: string;
      nik: string;
      version: number;
    };
    return payload;
  } catch {
    return null;
  }
}

function calculateStatus(checkInTime: Date): AttendanceStatus {
  const session = seedSessions.find((s) => s.type === 'check-in' && s.isActive);
  if (!session) return 'present';

  const [startHour, startMin] = session.startTime.split(':').map(Number);
  const tolerance = session.lateToleranceMinutes;

  const sessionStart = new Date(checkInTime);
  sessionStart.setHours(startHour ?? 7, (startMin ?? 0) + tolerance, 0, 0);

  return checkInTime <= sessionStart ? 'present' : 'late';
}

export const attendanceHandlers = [
  // POST /api/attendance/scan
  http.post('/api/attendance/scan', async ({ request }) => {
    await delay();
    const body = await request.json() as { token: string };
    const { token } = body;

    const today = new Date().toISOString().split('T')[0] ?? '';

    // Check holiday
    if (isHoliday(today)) {
      const result: ScanResult = {
        success: false,
        type: 'invalid',
        message: 'Hari ini adalah hari libur. Absensi tidak dapat dilakukan.',
      };
      return HttpResponse.json({ data: result });
    }

    // Check workday
    if (!isWorkday(today)) {
      const result: ScanResult = {
        success: false,
        type: 'invalid',
        message: 'Hari ini bukan hari kerja.',
      };
      return HttpResponse.json({ data: result });
    }

    // Decode token
    const decoded = decodeToken(token);
    if (!decoded) {
      const result: ScanResult = {
        success: false,
        type: 'invalid',
        message: 'QR Code tidak valid atau tidak dikenali.',
      };
      return HttpResponse.json({ data: result });
    }

    // Find employee
    const employee = employees.find((e) => e.id === decoded.employeeId);
    if (!employee) {
      const result: ScanResult = {
        success: false,
        type: 'invalid',
        message: 'Karyawan tidak ditemukan.',
      };
      return HttpResponse.json({ data: result });
    }

    // Check if employee is active
    if (employee.status === 'inactive') {
      const result: ScanResult = {
        success: false,
        type: 'inactive',
        employeeName: employee.fullName,
        message: `Karyawan ${employee.fullName} tidak aktif.`,
      };
      return HttpResponse.json({ data: result });
    }

    // Validate token version (check if token matches current employee token)
    if (employee.qrToken !== token) {
      const result: ScanResult = {
        success: false,
        type: 'invalid',
        message: 'QR Code sudah tidak berlaku. Silakan gunakan QR Code terbaru.',
      };
      return HttpResponse.json({ data: result });
    }

    // Check existing records for today
    const todayRecords = attendanceRecords.filter(
      (r) => r.employeeId === employee.id && r.date === today
    );

    const checkInRecord = todayRecords.find((r) => r.checkInTime !== null);
    const checkOutRecord = todayRecords.find((r) => r.checkOutTime !== null);

    const now = new Date();

    if (!checkInRecord) {
      // First scan = check-in
      const status = calculateStatus(now);
      const newRecord: AttendanceRecord = {
        id: generateId(),
        employeeId: employee.id,
        date: today,
        checkInTime: now,
        checkOutTime: null,
        workDuration: null,
        status,
        sessionId: 'session-001',
        isManualCorrection: false,
        leaveId: null,
      };
      attendanceRecords.push(newRecord);

      const result: ScanResult = {
        success: true,
        type: 'check-in',
        employeeName: employee.fullName,
        timestamp: now,
        status,
        message: `Absensi masuk berhasil. Status: ${status === 'present' ? 'Hadir' : 'Terlambat'}.`,
      };
      return HttpResponse.json({ data: result });
    }

    if (checkInRecord && !checkOutRecord) {
      // Second scan = check-out
      const checkIn = new Date(checkInRecord.checkInTime!);
      const workDuration = Math.floor((now.getTime() - checkIn.getTime()) / 60000);

      const index = attendanceRecords.findIndex((r) => r.id === checkInRecord.id);
      if (index !== -1) {
        attendanceRecords[index] = {
          ...attendanceRecords[index]!,
          checkOutTime: now,
          workDuration,
        };
      }

      const result: ScanResult = {
        success: true,
        type: 'check-out',
        employeeName: employee.fullName,
        timestamp: now,
        status: checkInRecord.status,
        message: `Absensi keluar berhasil. Durasi kerja: ${Math.floor(workDuration / 60)} jam ${workDuration % 60} menit.`,
      };
      return HttpResponse.json({ data: result });
    }

    // Already checked in and out
    const result: ScanResult = {
      success: false,
      type: 'duplicate',
      employeeName: employee.fullName,
      message: 'Absensi hari ini sudah lengkap (masuk dan keluar).',
    };
    return HttpResponse.json({ data: result });
  }),

  // GET /api/attendance
  http.get('/api/attendance', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const department = url.searchParams.get('department');
    const status = url.searchParams.get('status');
    const employeeId = url.searchParams.get('employeeId');

    let filtered = [...attendanceRecords];

    if (startDate) {
      filtered = filtered.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((r) => r.date <= endDate);
    }
    if (employeeId) {
      filtered = filtered.filter((r) => r.employeeId === employeeId);
    }
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (department && department !== 'all') {
      const deptEmployeeIds = employees
        .filter((e) => e.department === department)
        .map((e) => e.id);
      filtered = filtered.filter((r) => deptEmployeeIds.includes(r.employeeId));
    }

    return HttpResponse.json({ data: filtered, total: filtered.length });
  }),

  // GET /api/attendance/stats
  http.get('/api/attendance/stats', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const department = url.searchParams.get('department');

    let filtered = [...attendanceRecords];

    if (startDate) filtered = filtered.filter((r) => r.date >= startDate);
    if (endDate) filtered = filtered.filter((r) => r.date <= endDate);
    if (department && department !== 'all') {
      const deptEmployeeIds = employees
        .filter((e) => e.department === department)
        .map((e) => e.id);
      filtered = filtered.filter((r) => deptEmployeeIds.includes(r.employeeId));
    }

    const stats = {
      totalPresent: filtered.filter((r) => r.status === 'present').length,
      totalLate: filtered.filter((r) => r.status === 'late').length,
      totalAbsent: filtered.filter((r) => r.status === 'absent').length,
      totalLeave: filtered.filter((r) => r.status === 'leave').length,
      attendanceRate: 0,
    };

    const total = stats.totalPresent + stats.totalLate + stats.totalAbsent + stats.totalLeave;
    stats.attendanceRate = total > 0 ? Math.round(((stats.totalPresent + stats.totalLate) / total) * 100) : 0;

    return HttpResponse.json({ data: stats });
  }),

  // GET /api/attendance/:id/audit
  http.get('/api/attendance/:id/audit', async ({ params }) => {
    await delay();
    const { id } = params as { id: string };
    const record = attendanceRecords.find((r) => r.id === id);

    if (!record) {
      return HttpResponse.json({ message: 'Record tidak ditemukan.' }, { status: 404 });
    }

    return HttpResponse.json({ data: { record, corrections: [], leave: null } });
  }),
];

export { attendanceRecords };
