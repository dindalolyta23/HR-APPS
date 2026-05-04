import type {
  Employee,
  AttendanceRecord,
  AttendanceSession,
  Holiday,
  WorkdayConfig,
  AttendanceStatus,
} from '@shared/types';

// ─── Helper ──────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

function generateQRToken(employeeId: string, nik: string, version = 1): string {
  const payload = { employeeId, nik, issuedAt: Date.now(), version };
  return btoa(JSON.stringify(payload));
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0] ?? '';
}

function makeDateTime(dateString: string, hour: number, minute: number): Date {
  const d = new Date(dateString);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ─── Employees ───────────────────────────────────────────────────────────────

export const seedEmployees: Employee[] = [
  {
    id: 'emp-001',
    nik: 'ENG001',
    fullName: 'Budi Santoso',
    department: 'Engineering',
    position: 'Software Engineer',
    status: 'active',
    qrToken: generateQRToken('emp-001', 'ENG001'),
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    id: 'emp-002',
    nik: 'ENG002',
    fullName: 'Siti Rahayu',
    department: 'Engineering',
    position: 'Frontend Developer',
    status: 'active',
    qrToken: generateQRToken('emp-002', 'ENG002'),
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01'),
  },
  {
    id: 'emp-003',
    nik: 'ENG003',
    fullName: 'Ahmad Fauzi',
    department: 'Engineering',
    position: 'Backend Developer',
    status: 'active',
    qrToken: generateQRToken('emp-003', 'ENG003'),
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
  },
  {
    id: 'emp-004',
    nik: 'ENG004',
    fullName: 'Dewi Lestari',
    department: 'Engineering',
    position: 'QA Engineer',
    status: 'inactive',
    qrToken: generateQRToken('emp-004', 'ENG004'),
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'emp-005',
    nik: 'HR001',
    fullName: 'Rina Wulandari',
    department: 'HR',
    position: 'HR Manager',
    status: 'active',
    qrToken: generateQRToken('emp-005', 'HR001'),
    createdAt: new Date('2022-06-01'),
    updatedAt: new Date('2022-06-01'),
  },
  {
    id: 'emp-006',
    nik: 'HR002',
    fullName: 'Hendra Gunawan',
    department: 'HR',
    position: 'HR Staff',
    status: 'active',
    qrToken: generateQRToken('emp-006', 'HR002'),
    createdAt: new Date('2023-07-15'),
    updatedAt: new Date('2023-07-15'),
  },
  {
    id: 'emp-007',
    nik: 'HR003',
    fullName: 'Maya Sari',
    department: 'HR',
    position: 'Recruiter',
    status: 'active',
    qrToken: generateQRToken('emp-007', 'HR003'),
    createdAt: new Date('2023-08-20'),
    updatedAt: new Date('2023-08-20'),
  },
  {
    id: 'emp-008',
    nik: 'FIN001',
    fullName: 'Bambang Wijaya',
    department: 'Finance',
    position: 'Finance Manager',
    status: 'active',
    qrToken: generateQRToken('emp-008', 'FIN001'),
    createdAt: new Date('2022-03-01'),
    updatedAt: new Date('2022-03-01'),
  },
  {
    id: 'emp-009',
    nik: 'FIN002',
    fullName: 'Nurul Hidayah',
    department: 'Finance',
    position: 'Accountant',
    status: 'active',
    qrToken: generateQRToken('emp-009', 'FIN002'),
    createdAt: new Date('2023-05-10'),
    updatedAt: new Date('2023-05-10'),
  },
  {
    id: 'emp-010',
    nik: 'FIN003',
    fullName: 'Agus Prasetyo',
    department: 'Finance',
    position: 'Finance Staff',
    status: 'active',
    qrToken: generateQRToken('emp-010', 'FIN003'),
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-09-01'),
  },
];

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const seedSessions: AttendanceSession[] = [
  {
    id: 'session-001',
    name: 'Absensi Masuk',
    type: 'check-in',
    startTime: '07:00',
    endTime: '09:00',
    lateToleranceMinutes: 15,
    isActive: true,
  },
  {
    id: 'session-002',
    name: 'Absensi Keluar',
    type: 'check-out',
    startTime: '16:00',
    endTime: '18:00',
    lateToleranceMinutes: 0,
    isActive: true,
  },
];

// ─── Holidays ─────────────────────────────────────────────────────────────────

export const seedHolidays: Holiday[] = [
  { id: 'hol-001', date: '2024-01-01', name: 'Tahun Baru Masehi', type: 'national' },
  { id: 'hol-002', date: '2024-02-10', name: 'Tahun Baru Imlek', type: 'national' },
  { id: 'hol-003', date: '2024-03-11', name: 'Isra Miraj', type: 'national' },
  { id: 'hol-004', date: '2024-04-10', name: 'Hari Raya Idul Fitri', type: 'national' },
  { id: 'hol-005', date: '2024-05-01', name: 'Hari Buruh Internasional', type: 'national' },
];

// ─── Workday Config ───────────────────────────────────────────────────────────

export const seedWorkdayConfig: WorkdayConfig = {
  workDays: [1, 2, 3, 4, 5], // Mon–Fri
};

// ─── Attendance Records ───────────────────────────────────────────────────────

// Generate 30 days of attendance records for active employees
// Distribution: 80% present, 10% late, 5% absent, 5% leave

const activeEmployees = seedEmployees.filter((e) => e.status === 'active');

function getStatusForDay(seed: number): AttendanceStatus {
  const r = seed % 100;
  if (r < 80) return 'present';
  if (r < 90) return 'late';
  if (r < 95) return 'absent';
  return 'leave';
}

function isWeekend(dateString: string): boolean {
  const d = new Date(dateString);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isHoliday(dateString: string): boolean {
  return seedHolidays.some((h) => h.date === dateString);
}

export const seedAttendanceRecords: AttendanceRecord[] = [];

let recordCounter = 0;

for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
  const dateString = dateStr(daysAgo);

  // Skip weekends and holidays
  if (isWeekend(dateString) || isHoliday(dateString)) continue;

  for (const emp of activeEmployees) {
    recordCounter++;
    const seed = recordCounter * 7 + daysAgo * 13;
    const status = getStatusForDay(seed);

    let checkInTime: Date | null = null;
    let checkOutTime: Date | null = null;
    let workDuration: number | null = null;

    if (status === 'present') {
      // Check in between 07:00–08:15 (within tolerance)
      const checkInMinute = (seed % 75);
      checkInTime = makeDateTime(dateString, 7, checkInMinute);
      checkOutTime = makeDateTime(dateString, 16, 30 + (seed % 60));
      workDuration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);
    } else if (status === 'late') {
      // Check in after 08:15
      const lateMinutes = 16 + (seed % 90);
      const lateHour = 8 + Math.floor(lateMinutes / 60);
      const lateMin = lateMinutes % 60;
      checkInTime = makeDateTime(dateString, lateHour, lateMin);
      checkOutTime = makeDateTime(dateString, 17, seed % 30);
      workDuration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);
    }
    // absent and leave: no check-in/out

    seedAttendanceRecords.push({
      id: generateId('att'),
      employeeId: emp.id,
      date: dateString,
      checkInTime,
      checkOutTime,
      workDuration,
      status,
      sessionId: status !== 'absent' && status !== 'leave' ? 'session-001' : null,
      isManualCorrection: false,
      leaveId: status === 'leave' ? generateId('leave') : null,
    });
  }
}
