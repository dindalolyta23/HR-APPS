import { useEffect, useState, useCallback } from 'react';
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getHolidays,
  addHoliday,
  deleteHoliday,
  getWorkdayConfig,
  updateWorkdayConfig,
} from '../services/scheduleService';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import { Modal } from '@shared/components/ui/Modal';
import { Badge } from '@shared/components/ui/Badge';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { useUIStore } from '@shared/stores/uiStore';
import type { AttendanceSession, DayOfWeek, Holiday } from '@shared/types';

const DAY_NAMES: Record<DayOfWeek, string> = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

interface SessionFormData {
  name: string;
  type: 'check-in' | 'check-out';
  startTime: string;
  endTime: string;
  lateToleranceMinutes: number;
  isActive: boolean;
}

function SessionFormModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  session?: AttendanceSession | null;
  onSuccess: () => void;
}) {
  const addNotification = useUIStore((s) => s.addNotification);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<SessionFormData & { endTime: string }>>({});
  const [form, setForm] = useState<SessionFormData>({
    name: '',
    type: 'check-in',
    startTime: '07:00',
    endTime: '09:00',
    lateToleranceMinutes: 15,
    isActive: true,
  });

  useEffect(() => {
    if (session) {
      setForm({
        name: session.name,
        type: session.type,
        startTime: session.startTime,
        endTime: session.endTime,
        lateToleranceMinutes: session.lateToleranceMinutes,
        isActive: session.isActive,
      });
    } else {
      setForm({ name: '', type: 'check-in', startTime: '07:00', endTime: '09:00', lateToleranceMinutes: 15, isActive: true });
    }
    setErrors({});
  }, [session, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<SessionFormData & { endTime: string }> = {};
    if (!form.name.trim()) newErrors.name = 'Nama sesi wajib diisi.';
    if (form.startTime >= form.endTime) {
      newErrors.endTime = 'Waktu selesai harus lebih dari waktu mulai.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (session) {
        await updateSession(session.id, form);
        addNotification({ type: 'success', title: 'Sesi berhasil diperbarui.' });
      } else {
        await createSession(form);
        addNotification({ type: 'success', title: 'Sesi berhasil ditambahkan.' });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as Error & { field?: string };
      if (error.field === 'endTime') {
        setErrors((prev) => ({ ...prev, endTime: error.message }));
      } else {
        addNotification({ type: 'error', title: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={session ? 'Edit Sesi' : 'Tambah Sesi Absensi'}
      size="md"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Input
          label="Nama Sesi"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
          placeholder="Contoh: Absensi Masuk"
          required
          fullWidth
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Tipe</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'check-in' | 'check-out' }))}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="check-in">Absensi Masuk</option>
            <option value="check-out">Absensi Keluar</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Waktu Mulai"
            type="time"
            value={form.startTime}
            onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            required
            fullWidth
          />
          <Input
            label="Waktu Selesai"
            type="time"
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            error={errors.endTime}
            required
            fullWidth
          />
        </div>
        <Input
          label="Toleransi Keterlambatan (menit)"
          type="number"
          min={0}
          max={120}
          value={form.lateToleranceMinutes}
          onChange={(e) => setForm((f) => ({ ...f, lateToleranceMinutes: parseInt(e.target.value, 10) || 0 }))}
          fullWidth
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 rounded border-[var(--color-border)] text-blue-600"
          />
          <label htmlFor="isActive" className="text-sm text-[var(--color-text-secondary)]">
            Sesi aktif
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Batal</Button>
          <Button type="submit" isLoading={isLoading}>
            {session ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function SchedulePage() {
  const addNotification = useUIStore((s) => s.addNotification);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [workdays, setWorkdays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AttendanceSession | null>(null);
  const [isHolidayFormOpen, setIsHolidayFormOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: '', name: '', type: 'national' as 'national' | 'company' });
  const [isSavingWorkdays, setIsSavingWorkdays] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, h, w] = await Promise.all([getSessions(), getHolidays(), getWorkdayConfig()]);
      setSessions(s);
      setHolidays(h);
      setWorkdays(w.workDays);
    } catch {
      addNotification({ type: 'error', title: 'Gagal memuat data jadwal.' });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      addNotification({ type: 'success', title: 'Sesi berhasil dihapus.' });
    } catch {
      addNotification({ type: 'error', title: 'Gagal menghapus sesi.' });
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newHoliday = await addHoliday(holidayForm);
      setHolidays((prev) => [...prev, newHoliday]);
      setHolidayForm({ date: '', name: '', type: 'national' });
      setIsHolidayFormOpen(false);
      addNotification({ type: 'success', title: 'Hari libur berhasil ditambahkan.' });
    } catch (err) {
      const error = err as Error;
      addNotification({ type: 'error', title: error.message });
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      addNotification({ type: 'success', title: 'Hari libur berhasil dihapus.' });
    } catch {
      addNotification({ type: 'error', title: 'Gagal menghapus hari libur.' });
    }
  };

  const handleToggleWorkday = (day: DayOfWeek) => {
    setWorkdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSaveWorkdays = async () => {
    setIsSavingWorkdays(true);
    try {
      await updateWorkdayConfig({ workDays: workdays });
      addNotification({ type: 'success', title: 'Konfigurasi hari kerja berhasil disimpan.' });
    } catch {
      addNotification({ type: 'error', title: 'Gagal menyimpan konfigurasi.' });
    } finally {
      setIsSavingWorkdays(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Jadwal Kerja</h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          Konfigurasi sesi absensi, hari libur, dan hari kerja.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={80} className="w-full" rounded="lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Sessions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Sesi Absensi
              </h2>
              <Button
                size="sm"
                onClick={() => { setEditingSession(null); setIsSessionFormOpen(true); }}
                leftIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              >
                Tambah Sesi
              </Button>
            </div>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">Belum ada sesi absensi.</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--color-text-primary)]">{session.name}</p>
                        <Badge variant={session.isActive ? 'success' : 'default'}>
                          {session.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        <Badge variant="info">
                          {session.type === 'check-in' ? 'Masuk' : 'Keluar'}
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {session.startTime} – {session.endTime}
                        {session.lateToleranceMinutes > 0 && (
                          <span className="ml-2">
                            (Toleransi: {session.lateToleranceMinutes} menit)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingSession(session); setIsSessionFormOpen(true); }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleDeleteSession(session.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Workday Config */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
              Hari Kerja
            </h2>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => (
                  <button
                    key={day}
                    onClick={() => handleToggleWorkday(day)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      workdays.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                    aria-pressed={workdays.includes(day)}
                  >
                    {DAY_NAMES[day]}
                  </button>
                ))}
              </div>
              <Button size="sm" isLoading={isSavingWorkdays} onClick={() => void handleSaveWorkdays()}>
                Simpan Konfigurasi
              </Button>
            </div>
          </section>

          {/* Holidays */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Hari Libur
              </h2>
              <Button
                size="sm"
                onClick={() => setIsHolidayFormOpen(true)}
                leftIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              >
                Tambah Hari Libur
              </Button>
            </div>
            <div className="space-y-2">
              {holidays.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">Belum ada hari libur.</p>
              ) : (
                holidays
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-[var(--color-text-tertiary)]">
                          {holiday.date}
                        </span>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {holiday.name}
                        </span>
                        <Badge variant={holiday.type === 'national' ? 'primary' : 'warning'}>
                          {holiday.type === 'national' ? 'Nasional' : 'Perusahaan'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeleteHoliday(holiday.id)}
                        aria-label={`Hapus hari libur ${holiday.name}`}
                      >
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </section>
        </>
      )}

      {/* Session Form Modal */}
      <SessionFormModal
        isOpen={isSessionFormOpen}
        onClose={() => setIsSessionFormOpen(false)}
        session={editingSession}
        onSuccess={() => void fetchAll()}
      />

      {/* Holiday Form Modal */}
      <Modal
        isOpen={isHolidayFormOpen}
        onClose={() => setIsHolidayFormOpen(false)}
        title="Tambah Hari Libur"
        size="sm"
      >
        <form onSubmit={(e) => void handleAddHoliday(e)} className="space-y-4">
          <Input
            label="Tanggal"
            type="date"
            value={holidayForm.date}
            onChange={(e) => setHolidayForm((f) => ({ ...f, date: e.target.value }))}
            required
            fullWidth
          />
          <Input
            label="Nama Hari Libur"
            value={holidayForm.name}
            onChange={(e) => setHolidayForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Contoh: Hari Raya Idul Fitri"
            required
            fullWidth
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Tipe</label>
            <select
              value={holidayForm.type}
              onChange={(e) => setHolidayForm((f) => ({ ...f, type: e.target.value as 'national' | 'company' }))}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="national">Nasional</option>
              <option value="company">Perusahaan</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsHolidayFormOpen(false)}>Batal</Button>
            <Button type="submit">Tambah</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
