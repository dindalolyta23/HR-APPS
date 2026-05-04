-- ============================================================
-- HR Mini App — Database Schema
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Employees ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nik TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  qr_token TEXT UNIQUE,
  qr_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Attendance Sessions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('check-in', 'check-out')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  late_tolerance_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- ─── Holidays ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'national' CHECK (type IN ('national', 'company'))
);

-- ─── Workday Config ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workday_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Attendance Records ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  work_duration_minutes INTEGER,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent', 'leave')),
  session_id UUID REFERENCES public.attendance_sessions(id),
  is_manual_correction BOOLEAN DEFAULT false,
  leave_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- ─── Leave Records ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Correction Records ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.correction_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_record_id UUID REFERENCES public.attendance_records(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  original_check_in TIMESTAMPTZ,
  original_check_out TIMESTAMPTZ,
  corrected_check_in TIMESTAMPTZ,
  corrected_check_out TIMESTAMPTZ,
  reason TEXT NOT NULL,
  corrected_by UUID REFERENCES auth.users(id),
  corrected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_employees_nik ON public.employees(nik);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_leave_employee_date ON public.leave_records(employee_id, date);

-- ─── RLS Policies ─────────────────────────────────────────────
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workday_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_records ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'employee'
  );
$$ LANGUAGE SQL STABLE;

-- Employees: admin full access, employee read own
CREATE POLICY "employees_admin_all" ON public.employees
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "employees_self_read" ON public.employees
  FOR SELECT USING (
    public.get_user_role() = 'employee' AND
    user_id = auth.uid()
  );

-- Attendance records: admin full, employee read own
CREATE POLICY "attendance_admin_all" ON public.attendance_records
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "attendance_employee_read" ON public.attendance_records
  FOR SELECT USING (
    public.get_user_role() = 'employee' AND
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

-- Sessions, holidays, workday: all authenticated users can read
CREATE POLICY "sessions_read_all" ON public.attendance_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "sessions_admin_write" ON public.attendance_sessions
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "holidays_read_all" ON public.holidays
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "holidays_admin_write" ON public.holidays
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "workday_read_all" ON public.workday_config
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "workday_admin_write" ON public.workday_config
  FOR ALL USING (public.get_user_role() = 'admin');

-- Leave records: admin full, employee read own
CREATE POLICY "leave_admin_all" ON public.leave_records
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "leave_employee_read" ON public.leave_records
  FOR SELECT USING (
    public.get_user_role() = 'employee' AND
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

-- Correction records: admin full, employee read own
CREATE POLICY "correction_admin_all" ON public.correction_records
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "correction_employee_read" ON public.correction_records
  FOR SELECT USING (
    public.get_user_role() = 'employee' AND
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

-- ─── Seed Data ────────────────────────────────────────────────

-- Default workday config (Mon-Fri)
INSERT INTO public.workday_config (work_days)
VALUES ('{1,2,3,4,5}')
ON CONFLICT DO NOTHING;

-- Default attendance sessions
INSERT INTO public.attendance_sessions (name, type, start_time, end_time, late_tolerance_minutes, is_active)
VALUES
  ('Absensi Masuk', 'check-in', '07:00', '09:00', 15, true),
  ('Absensi Keluar', 'check-out', '16:00', '18:00', 0, true)
ON CONFLICT DO NOTHING;

-- Holidays 2025
INSERT INTO public.holidays (date, name, type) VALUES
  ('2025-01-01', 'Tahun Baru Masehi', 'national'),
  ('2025-01-29', 'Tahun Baru Imlek', 'national'),
  ('2025-03-29', 'Hari Raya Nyepi', 'national'),
  ('2025-03-31', 'Isra Miraj', 'national'),
  ('2025-04-18', 'Wafat Isa Almasih', 'national'),
  ('2025-05-01', 'Hari Buruh Internasional', 'national'),
  ('2025-05-12', 'Hari Raya Waisak', 'national'),
  ('2025-05-29', 'Kenaikan Isa Almasih', 'national'),
  ('2025-06-01', 'Hari Lahir Pancasila', 'national'),
  ('2025-06-06', 'Hari Raya Idul Adha', 'national'),
  ('2025-06-27', 'Tahun Baru Islam', 'national'),
  ('2025-08-17', 'Hari Kemerdekaan RI', 'national'),
  ('2025-09-05', 'Maulid Nabi Muhammad SAW', 'national'),
  ('2025-12-25', 'Hari Raya Natal', 'national')
ON CONFLICT (date) DO NOTHING;

-- ─── Update user role to admin ────────────────────────────────
-- Jalankan ini TERPISAH setelah register akun pertama kamu
-- Ganti 'your-email@example.com' dengan email kamu
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-email@example.com';
