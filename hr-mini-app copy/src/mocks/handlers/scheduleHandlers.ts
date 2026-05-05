import { http, HttpResponse } from 'msw';
import { delay } from '../utils/delay';
import { seedSessions, seedHolidays, seedWorkdayConfig } from '../data';
import type { AttendanceSession, Holiday, WorkdayConfig } from '@shared/types';

let sessions: AttendanceSession[] = [...seedSessions];
let holidays: Holiday[] = [...seedHolidays];
let workdayConfig: WorkdayConfig = { ...seedWorkdayConfig };

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export const scheduleHandlers = [
  // GET /api/schedule/sessions
  http.get('/api/schedule/sessions', async () => {
    await delay();
    return HttpResponse.json({ data: sessions });
  }),

  // POST /api/schedule/sessions
  http.post('/api/schedule/sessions', async ({ request }) => {
    await delay();
    const body = await request.json() as Omit<AttendanceSession, 'id'>;

    // Validate startTime < endTime
    if (parseTime(body.startTime) >= parseTime(body.endTime)) {
      return HttpResponse.json(
        { message: 'Waktu mulai harus lebih awal dari waktu selesai.', field: 'endTime' },
        { status: 400 }
      );
    }

    const newSession: AttendanceSession = {
      ...body,
      id: generateId('session'),
    };

    sessions.push(newSession);
    return HttpResponse.json({ data: newSession }, { status: 201 });
  }),

  // PUT /api/schedule/sessions/:id
  http.put('/api/schedule/sessions/:id', async ({ params, request }) => {
    await delay();
    const { id } = params as { id: string };
    const body = await request.json() as Partial<AttendanceSession>;

    const index = sessions.findIndex((s) => s.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Sesi tidak ditemukan.' }, { status: 404 });
    }

    const updated = { ...sessions[index]!, ...body };

    if (parseTime(updated.startTime) >= parseTime(updated.endTime)) {
      return HttpResponse.json(
        { message: 'Waktu mulai harus lebih awal dari waktu selesai.', field: 'endTime' },
        { status: 400 }
      );
    }

    sessions[index] = updated;
    return HttpResponse.json({ data: updated });
  }),

  // DELETE /api/schedule/sessions/:id
  http.delete('/api/schedule/sessions/:id', async ({ params }) => {
    await delay();
    const { id } = params as { id: string };
    sessions = sessions.filter((s) => s.id !== id);
    return HttpResponse.json({ data: null, message: 'Sesi berhasil dihapus.' });
  }),

  // GET /api/schedule/holidays
  http.get('/api/schedule/holidays', async () => {
    await delay();
    return HttpResponse.json({ data: holidays });
  }),

  // POST /api/schedule/holidays
  http.post('/api/schedule/holidays', async ({ request }) => {
    await delay();
    const body = await request.json() as Omit<Holiday, 'id'>;

    const existing = holidays.find((h) => h.date === body.date);
    if (existing) {
      return HttpResponse.json(
        { message: 'Tanggal ini sudah terdaftar sebagai hari libur.', field: 'date' },
        { status: 409 }
      );
    }

    const newHoliday: Holiday = {
      ...body,
      id: generateId('hol'),
    };

    holidays.push(newHoliday);
    return HttpResponse.json({ data: newHoliday }, { status: 201 });
  }),

  // DELETE /api/schedule/holidays/:id
  http.delete('/api/schedule/holidays/:id', async ({ params }) => {
    await delay();
    const { id } = params as { id: string };
    holidays = holidays.filter((h) => h.id !== id);
    return HttpResponse.json({ data: null, message: 'Hari libur berhasil dihapus.' });
  }),

  // GET /api/schedule/workdays
  http.get('/api/schedule/workdays', async () => {
    await delay();
    return HttpResponse.json({ data: workdayConfig });
  }),

  // PUT /api/schedule/workdays
  http.put('/api/schedule/workdays', async ({ request }) => {
    await delay();
    const body = await request.json() as WorkdayConfig;
    workdayConfig = body;
    return HttpResponse.json({ data: workdayConfig });
  }),
];
