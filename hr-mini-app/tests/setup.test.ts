import { describe, expect, it } from 'vitest';
import { cn } from '../src/shared/utils/cn';
import {
  isValidNIK,
  isValidTimeFormat,
  isStartBeforeEnd,
  isValidDateString,
  isValidLeaveReason,
} from '../src/shared/utils/validationUtils';
import {
  toDateString,
  toTimeString,
  calculateWorkDuration,
  formatWorkDuration,
  parseTimeToMinutes,
} from '../src/shared/utils/dateUtils';
import { generateExportFilename } from '../src/shared/utils/formatUtils';

describe('Setup verification', () => {
  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });
});

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('validationUtils', () => {
  describe('isValidNIK', () => {
    it('accepts valid NIK formats', () => {
      expect(isValidNIK('ABC123')).toBe(true);
      expect(isValidNIK('EMP001234')).toBe(true);
      expect(isValidNIK('ABCDEF123456')).toBe(true);
    });

    it('rejects invalid NIK formats', () => {
      expect(isValidNIK('abc123')).toBe(false); // lowercase
      expect(isValidNIK('AB1')).toBe(false); // too short
      expect(isValidNIK('ABCDEF1234567')).toBe(false); // too long
      expect(isValidNIK('ABC-123')).toBe(false); // special chars
    });
  });

  describe('isValidTimeFormat', () => {
    it('accepts valid time formats', () => {
      expect(isValidTimeFormat('08:00')).toBe(true);
      expect(isValidTimeFormat('23:59')).toBe(true);
      expect(isValidTimeFormat('00:00')).toBe(true);
    });

    it('rejects invalid time formats', () => {
      expect(isValidTimeFormat('24:00')).toBe(false);
      expect(isValidTimeFormat('8:00')).toBe(false);
      expect(isValidTimeFormat('08:60')).toBe(false);
    });
  });

  describe('isStartBeforeEnd', () => {
    it('returns true when start is before end', () => {
      expect(isStartBeforeEnd('08:00', '17:00')).toBe(true);
      expect(isStartBeforeEnd('00:00', '23:59')).toBe(true);
    });

    it('returns false when start equals end', () => {
      expect(isStartBeforeEnd('08:00', '08:00')).toBe(false);
    });

    it('returns false when start is after end', () => {
      expect(isStartBeforeEnd('17:00', '08:00')).toBe(false);
    });
  });

  describe('isValidDateString', () => {
    it('accepts valid date strings', () => {
      expect(isValidDateString('2024-01-15')).toBe(true);
      expect(isValidDateString('2024-12-31')).toBe(true);
    });

    it('rejects invalid date strings', () => {
      expect(isValidDateString('2024-13-01')).toBe(false);
      expect(isValidDateString('01-01-2024')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
    });
  });

  describe('isValidLeaveReason', () => {
    it('accepts reasons with 10+ characters', () => {
      expect(isValidLeaveReason('Sakit demam tinggi')).toBe(true);
    });

    it('rejects reasons with fewer than 10 characters', () => {
      expect(isValidLeaveReason('Sakit')).toBe(false);
      expect(isValidLeaveReason('')).toBe(false);
    });
  });
});

describe('dateUtils', () => {
  describe('toDateString', () => {
    it('formats date to YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:00:00');
      expect(toDateString(date)).toBe('2024-01-15');
    });
  });

  describe('toTimeString', () => {
    it('formats date to HH:mm', () => {
      const date = new Date('2024-01-15T08:30:00');
      expect(toTimeString(date)).toBe('08:30');
    });
  });

  describe('calculateWorkDuration', () => {
    it('calculates duration in minutes', () => {
      const checkIn = new Date('2024-01-15T08:00:00');
      const checkOut = new Date('2024-01-15T17:00:00');
      expect(calculateWorkDuration(checkIn, checkOut)).toBe(540);
    });

    it('returns null when either time is null', () => {
      expect(calculateWorkDuration(null, new Date())).toBeNull();
      expect(calculateWorkDuration(new Date(), null)).toBeNull();
      expect(calculateWorkDuration(null, null)).toBeNull();
    });

    it('returns null when checkout is before checkin', () => {
      const checkIn = new Date('2024-01-15T17:00:00');
      const checkOut = new Date('2024-01-15T08:00:00');
      expect(calculateWorkDuration(checkIn, checkOut)).toBeNull();
    });
  });

  describe('formatWorkDuration', () => {
    it('formats minutes to hours and minutes', () => {
      expect(formatWorkDuration(540)).toBe('9j');
      expect(formatWorkDuration(495)).toBe('8j 15m');
      expect(formatWorkDuration(30)).toBe('30m');
    });

    it('returns dash for null', () => {
      expect(formatWorkDuration(null)).toBe('-');
    });
  });

  describe('parseTimeToMinutes', () => {
    it('converts HH:mm to total minutes', () => {
      expect(parseTimeToMinutes('08:00')).toBe(480);
      expect(parseTimeToMinutes('17:30')).toBe(1050);
      expect(parseTimeToMinutes('00:00')).toBe(0);
    });
  });
});

describe('formatUtils', () => {
  describe('generateExportFilename', () => {
    it('generates correct filename with department', () => {
      const filename = generateExportFilename('Engineering', '2024-01-01', '2024-01-31');
      expect(filename).toBe('Rekap_Kehadiran_Engineering_20240101_20240131.xlsx');
    });

    it('uses "Semua" when no department specified', () => {
      const filename = generateExportFilename(undefined, '2024-01-01', '2024-01-31');
      expect(filename).toBe('Rekap_Kehadiran_Semua_20240101_20240131.xlsx');
    });

    it('replaces spaces in department name with underscores', () => {
      const filename = generateExportFilename('Human Resources', '2024-01-01', '2024-01-31');
      expect(filename).toBe('Rekap_Kehadiran_Human_Resources_20240101_20240131.xlsx');
    });
  });
});
