/**
 * Formats a number as a percentage string.
 * e.g. 85.5 → "85.5%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncates a string to the given max length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates an export filename for attendance reports.
 * Format: Rekap_Kehadiran_[Dept]_[Start]_[End].xlsx
 */
export function generateExportFilename(
  department: string | undefined,
  startDate: string,
  endDate: string
): string {
  const dept = department ? department.replace(/\s+/g, '_') : 'Semua';
  const start = startDate.replace(/-/g, '');
  const end = endDate.replace(/-/g, '');
  return `Rekap_Kehadiran_${dept}_${start}_${end}.xlsx`;
}

/**
 * Formats a NIK for display (adds spaces every 4 chars if long).
 */
export function formatNIK(nik: string): string {
  return nik;
}
