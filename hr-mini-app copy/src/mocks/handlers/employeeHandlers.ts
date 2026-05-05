import { http, HttpResponse } from 'msw';
import { delay } from '../utils/delay';
import { seedEmployees } from '../data';
import type { Employee, CreateEmployeePayload, UpdateEmployeePayload } from '@shared/types';

// Mutable in-memory store
let employees: Employee[] = [...seedEmployees];

function generateId(): string {
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateQRToken(employeeId: string, nik: string, version = 1): string {
  const payload = { employeeId, nik, issuedAt: Date.now(), version };
  return btoa(JSON.stringify(payload));
}

export const employeeHandlers = [
  // GET /api/employees
  http.get('/api/employees', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const department = url.searchParams.get('department');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '10', 10);

    let filtered = [...employees];

    if (department && department !== 'all') {
      filtered = filtered.filter((e) => e.department === department);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter((e) => e.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.nik.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginated,
      total,
      page,
      pageSize,
    });
  }),

  // GET /api/employees/:id
  http.get('/api/employees/:id', async ({ params }) => {
    await delay();
    const { id } = params as { id: string };
    const employee = employees.find((e) => e.id === id);

    if (!employee) {
      return HttpResponse.json({ message: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    return HttpResponse.json({ data: employee });
  }),

  // POST /api/employees
  http.post('/api/employees', async ({ request }) => {
    await delay();
    const body = await request.json() as CreateEmployeePayload;

    // Validate NIK uniqueness
    const existing = employees.find((e) => e.nik === body.nik);
    if (existing) {
      return HttpResponse.json(
        { message: 'NIK sudah digunakan oleh karyawan lain.', field: 'nik' },
        { status: 409 }
      );
    }

    const id = generateId();
    const newEmployee: Employee = {
      id,
      nik: body.nik,
      fullName: body.fullName,
      department: body.department,
      position: body.position,
      status: 'active',
      qrToken: generateQRToken(id, body.nik),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    employees.push(newEmployee);

    return HttpResponse.json({ data: newEmployee }, { status: 201 });
  }),

  // PUT /api/employees/:id
  http.put('/api/employees/:id', async ({ params, request }) => {
    await delay();
    const { id } = params as { id: string };
    const body = await request.json() as UpdateEmployeePayload;

    const index = employees.findIndex((e) => e.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    const updated: Employee = {
      ...employees[index]!,
      ...body,
      updatedAt: new Date(),
    };

    employees[index] = updated;

    return HttpResponse.json({ data: updated });
  }),

  // PATCH /api/employees/:id/deactivate
  http.patch('/api/employees/:id/deactivate', async ({ params }) => {
    await delay();
    const { id } = params as { id: string };

    const index = employees.findIndex((e) => e.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    employees[index] = {
      ...employees[index]!,
      status: 'inactive',
      updatedAt: new Date(),
    };

    return HttpResponse.json({ data: employees[index] });
  }),
];

// Export for use in other handlers
export { employees };
