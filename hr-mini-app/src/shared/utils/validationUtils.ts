/**
 * Validates that a NIK (Nomor Induk Karyawan) is in the correct format.
 * Must be 6–12 alphanumeric uppercase characters.
 */
export function isValidNIK(nik: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(nik);
}

/**
 * Validates that a time string is in "HH:mm" format.
 */
export function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

/**
 * Validates that startTime is strictly before endTime.
 * Both must be in "HH:mm" format.
 */
export function isStartBeforeEnd(startTime: string, endTime: string): boolean {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = (startH ?? 0) * 60 + (startM ?? 0);
  const endMinutes = (endH ?? 0) * 60 + (endM ?? 0);
  return startMinutes < endMinutes;
}

/**
 * Validates that a date string is in "YYYY-MM-DD" format.
 */
export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

/**
 * Validates that a leave reason meets minimum length requirement.
 */
export function isValidLeaveReason(reason: string): boolean {
  return reason.trim().length >= 10;
}

/**
 * Validates that a full name is not empty and has reasonable length.
 */
export function isValidFullName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
}
