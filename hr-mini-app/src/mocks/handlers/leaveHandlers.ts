import { http, HttpResponse } from 'msw';
import { delay } from '../utils/delay';
import { attendanceRecords } from './attendanceHandlers';
import type { CorrectionRecord, LeaveRecord } from '@shared/types';

let leaveRecords: LeaveRecord[] = [];
let correctionRecords: CorrectionRecord[] = [];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const leaveHandlers = [
  // GET /api/leave
  http.get('/api/leave', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');

    let filtered = [...leaveRecords];
    if (employeeId) {
      filtered = filtered.filter((l) => l.employeeId === employeeId);
    }

    return HttpResponse.json({ data: filtered });
  }),

  // POST /api/leave
  http.post('/api/leave', async ({ request }) => {
    await delay();
    const body = await request.json() as {
      employeeId: string;
      date: string;
      reason: string;
      submittedBy: string;
    };

    if (!body.reason || body.reason.trim().length < 10) {
      return HttpResponse.json(
        { message: 'Alasan izin minimal 10 karakter.', field: 'reason' },
        { status: 400 }
      );
    }

    const newLeave: LeaveRecord = {
      id: generateId('leave'),
      employeeId: body.employeeId,
      date: body.date,
      reason: body.reason.trim(),
      submittedBy: body.submittedBy,
      submittedAt: new Date(),
    };

    leaveRecords.push(newLeave);

    // Update attendance record status to 'leave'
    const attIndex = attendanceRecords.findIndex(
      (r) => r.employeeId === body.employeeId && r.date === body.date
    );

    if (attIndex !== -1) {
      attendanceRecords[attIndex] = {
        ...attendanceRecords[attIndex]!,
        status: 'leave',
        leaveId: newLeave.id,
      };
    } else {
      // Create new attendance record with leave status
      attendanceRecords.push({
        id: generateId('att'),
        employeeId: body.employeeId,
        date: body.date,
        checkInTime: null,
        checkOutTime: null,
        workDuration: null,
        status: 'leave',
        sessionId: null,
        isManualCorrection: false,
        leaveId: newLeave.id,
      });
    }

    return HttpResponse.json({ data: newLeave }, { status: 201 });
  }),

  // GET /api/corrections
  http.get('/api/corrections', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');

    let filtered = [...correctionRecords];
    if (employeeId) {
      filtered = filtered.filter((c) => c.employeeId === employeeId);
    }

    return HttpResponse.json({ data: filtered });
  }),

  // POST /api/attendance/correction
  http.post('/api/attendance/correction', async ({ request }) => {
    await delay();
    const body = await request.json() as {
      attendanceRecordId: string;
      employeeId: string;
      date: string;
      correctedCheckIn: string | null;
      correctedCheckOut: string | null;
      reason: string;
      correctedBy: string;
    };

    if (!body.reason || body.reason.trim().length < 5) {
      return HttpResponse.json(
        { message: 'Alasan koreksi minimal 5 karakter.', field: 'reason' },
        { status: 400 }
      );
    }

    // Find original record
    const attIndex = attendanceRecords.findIndex((r) => r.id === body.attendanceRecordId);

    const originalRecord = attIndex !== -1 ? attendanceRecords[attIndex] : null;

    const correction: CorrectionRecord = {
      id: generateId('corr'),
      attendanceRecordId: body.attendanceRecordId,
      employeeId: body.employeeId,
      date: body.date,
      originalCheckIn: originalRecord?.checkInTime ?? null,
      originalCheckOut: originalRecord?.checkOutTime ?? null,
      correctedCheckIn: body.correctedCheckIn ? new Date(body.correctedCheckIn) : null,
      correctedCheckOut: body.correctedCheckOut ? new Date(body.correctedCheckOut) : null,
      reason: body.reason.trim(),
      correctedBy: body.correctedBy,
      correctedAt: new Date(),
    };

    correctionRecords.push(correction);

    // Update attendance record
    if (attIndex !== -1) {
      const correctedIn = correction.correctedCheckIn;
      const correctedOut = correction.correctedCheckOut;
      const workDuration =
        correctedIn && correctedOut
          ? Math.floor((correctedOut.getTime() - correctedIn.getTime()) / 60000)
          : null;

      attendanceRecords[attIndex] = {
        ...attendanceRecords[attIndex]!,
        checkInTime: correctedIn,
        checkOutTime: correctedOut,
        workDuration,
        isManualCorrection: true,
      };
    }

    return HttpResponse.json({ data: correction }, { status: 201 });
  }),

  // GET /api/attendance/:id/audit
  http.get('/api/attendance/:id/audit', async ({ params }) => {
    await delay();
    const { id } = params as { id: string };

    const record = attendanceRecords.find((r) => r.id === id);
    if (!record) {
      return HttpResponse.json({ message: 'Record tidak ditemukan.' }, { status: 404 });
    }

    const corrections = correctionRecords.filter((c) => c.attendanceRecordId === id);
    const leave = record.leaveId
      ? leaveRecords.find((l) => l.id === record.leaveId) ?? null
      : null;

    return HttpResponse.json({ data: { record, corrections, leave } });
  }),
];

export { leaveRecords, correctionRecords };
