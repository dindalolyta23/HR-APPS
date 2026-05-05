// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'employee';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  employeeId: string | null; // null for pure admin
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LockoutInfo {
  isLocked: boolean;
  lockedUntil: Date | null;
  failedAttempts: number;
}

export interface Session {
  token: string;
  user: AuthUser;
  expiresAt: Date;
}

// ─── Employee ────────────────────────────────────────────────────────────────

export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  nik: string; // Nomor Induk Karyawan — unique
  fullName: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  qrToken: string; // Encrypted token, unique per employee
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeePayload {
  nik: string;
  fullName: string;
  department: string;
  position: string;
  avatarUrl?: string;
}

export interface UpdateEmployeePayload {
  fullName?: string;
  department?: string;
  position?: string;
  status?: EmployeeStatus;
}

// ─── QR Code ─────────────────────────────────────────────────────────────────

export interface QRTokenPayload {
  employeeId: string;
  nik: string;
  issuedAt: number; // Unix timestamp
  version: number; // Incremented on regeneration
}

export interface QRCodeData {
  employeeId: string;
  token: string;
  qrDataUrl: string; // Base64 PNG data URL
  generatedAt: Date;
}

// ─── Schedule & Sessions ─────────────────────────────────────────────────────

export type SessionType = 'check-in' | 'check-out';

export interface AttendanceSession {
  id: string;
  name: string;
  type: SessionType;
  startTime: string; // Format "HH:mm"
  endTime: string; // Format "HH:mm" — MUST be > startTime
  lateToleranceMinutes: number;
  isActive: boolean;
}

export interface Holiday {
  id: string;
  date: string; // Format "YYYY-MM-DD"
  name: string;
  type: 'national' | 'company';
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface WorkdayConfig {
  workDays: DayOfWeek[]; // e.g. [1,2,3,4,5] for Mon–Fri
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // Format "YYYY-MM-DD"
  checkInTime: Date | null;
  checkOutTime: Date | null;
  workDuration: number | null; // In minutes
  status: AttendanceStatus;
  sessionId: string | null;
  isManualCorrection: boolean;
  leaveId: string | null;
}

export interface ScanResult {
  success: boolean;
  type: 'check-in' | 'check-out' | 'duplicate' | 'invalid' | 'inactive';
  employeeName?: string;
  timestamp?: Date;
  status?: AttendanceStatus;
  message: string;
}

// ─── Reports & Statistics ────────────────────────────────────────────────────

export interface AttendanceFilters {
  startDate: string;
  endDate: string;
  department?: string;
  status?: AttendanceStatus;
  employeeId?: string;
}

export interface EmployeeAttendanceSummary {
  employee: Pick<Employee, 'id' | 'nik' | 'fullName' | 'department'>;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalLeave: number;
  attendancePercentage: number; // 0–100
}

export interface DailyAttendanceDetail {
  date: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  workDuration: number | null;
  status: AttendanceStatus;
  corrections: CorrectionRecord[];
  leave: LeaveRecord | null;
}

// ─── Leave & Correction ──────────────────────────────────────────────────────

export type LeaveReason = string; // Free text, min 10 chars

export interface LeaveRecord {
  id: string;
  employeeId: string;
  date: string;
  reason: LeaveReason;
  submittedBy: string; // Admin user ID
  submittedAt: Date;
}

export interface CorrectionRecord {
  id: string;
  attendanceRecordId: string;
  employeeId: string;
  date: string;
  originalCheckIn: Date | null;
  originalCheckOut: Date | null;
  correctedCheckIn: Date | null;
  correctedCheckOut: Date | null;
  reason: string;
  correctedBy: string; // Admin user ID
  correctedAt: Date;
}

// ─── Export ──────────────────────────────────────────────────────────────────

export interface ExportConfig {
  startDate: string;
  endDate: string;
  department?: string;
  filename: string; // Format: Rekap_Kehadiran_[Dept]_[Start]_[End].xlsx
}

export interface ExportRow {
  nik: string;
  fullName: string;
  department: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  workDuration: string;
  status: string;
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
