import { http, HttpResponse } from 'msw';
import { delay } from '../utils/delay';
import { employees } from './employeeHandlers';
import type { QRCodeData } from '@shared/types';

function generateQRToken(employeeId: string, nik: string, version: number): string {
  const payload = { employeeId, nik, issuedAt: Date.now(), version };
  return btoa(JSON.stringify(payload));
}

function getTokenVersion(token: string): number {
  try {
    const payload = JSON.parse(atob(token)) as { version?: number };
    return payload.version ?? 1;
  } catch {
    return 1;
  }
}

export const qrHandlers = [
  // GET /api/employees/:id/qr
  http.get('/api/employees/:id/qr', async ({ params }) => {
    await delay();
    const { id } = params as { id: string };
    const employee = employees.find((e) => e.id === id);

    if (!employee) {
      return HttpResponse.json({ message: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    const qrData: QRCodeData = {
      employeeId: employee.id,
      token: employee.qrToken,
      qrDataUrl: '', // Will be generated client-side
      generatedAt: new Date(),
    };

    return HttpResponse.json({ data: qrData });
  }),

  // POST /api/employees/:id/qr/regenerate
  http.post('/api/employees/:id/qr/regenerate', async ({ params }) => {
    await delay();
    const { id } = params as { id: string };
    const index = employees.findIndex((e) => e.id === id);

    if (index === -1) {
      return HttpResponse.json({ message: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    const employee = employees[index]!;
    const currentVersion = getTokenVersion(employee.qrToken);
    const newToken = generateQRToken(employee.id, employee.nik, currentVersion + 1);

    employees[index] = {
      ...employee,
      qrToken: newToken,
      updatedAt: new Date(),
    };

    const qrData: QRCodeData = {
      employeeId: employee.id,
      token: newToken,
      qrDataUrl: '',
      generatedAt: new Date(),
    };

    return HttpResponse.json({ data: qrData });
  }),
];
