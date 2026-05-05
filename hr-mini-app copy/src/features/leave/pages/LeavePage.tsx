import { useEffect, useState, useCallback } from 'react';
import { submitLeave, submitCorrection, getLeaveRecords, getCorrectionRecords } from '../services/leaveService';
import { getEmployees } from '@features/employees/services/employeeService';
import { getAttendanceRecords } from '@features/attendance/services/attendanceService';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import { Modal } from '@shared/components/ui/Modal';
import { Badge } from '@shared/components/ui/Badge';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { useAuthStore } from '@features/auth/store/authStore';
import { useUIStore } from '@shared/stores/uiStore';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { CorrectionRecord, Employee, LeaveRecord } from '@shared/types';

type TabType = 'leave' | 'correction';

export default function LeavePage() {
  const user = useAuthStore((s) => s.user);
  const addNotification = useUIStore((s) => s.addNotification);

  const [activeTab, setActiveTab] = useState<TabType>('leave');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [correctionRecords, setCorrectionRecords] = useState<CorrectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Leave form state
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    date: '',
    reason: '',
  });
  const [leaveErrors, setLeaveErrors] = useState<Record<string, string>>({});
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [conflictWarning, setConflictWarning] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<typeof leaveForm | null>(null);

  // Correction form state
  const [correctionForm, setCorrectionForm] = useState({
    employeeId: '',
    date: '',
    attendanceRecordId: '',
    correctedCheckIn: '',
    correctedCheckOut: '',
    reason: '',
  });
  const [correctionErrors, setCorrectionErrors] = useState<Record<string, string>>({});
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empResult, leaves, corrections] = await Promise.all([
        getEmployees({ pageSize: 1000 }),
        getLeaveRecords(),
        getCorrectionRecords(),
      ]);
      setEmployees(empResult.data);
      setLeaveRecords(leaves);
      setCorrectionRecords(corrections);
    } catch {
      addNotification({ type: 'error', title: 'Gagal memuat data.' });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const validateLeave = (): boolean => {
    const errors: Record<string, string> = {};
    if (!leaveForm.employeeId) errors.employeeId = 'Pilih karyawan.';
    if (!leaveForm.date) errors.date = 'Tanggal wajib diisi.';
    if (!leaveForm.reason.trim() || leaveForm.reason.trim().length < 10) {
      errors.reason = 'Alasan minimal 10 karakter.';
    }
    setLeaveErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLeaveSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!validateLeave()) return;

    // Check for conflict
    if (!force) {
      try {
        const records = await getAttendanceRecords({
          startDate: leaveForm.date,
          endDate: leaveForm.date,
          employeeId: leaveForm.employeeId,
        });
        const hasAttendance = records.some(
          (r) => r.employeeId === leaveForm.employeeId && r.date === leaveForm.date && r.checkInTime !== null
        );
        if (hasAttendance) {
          setPendingLeave(leaveForm);
          setConflictWarning(true);
          return;
        }
      } catch {
        // Continue without conflict check
      }
    }

    setIsSubmittingLeave(true);
    try {
      await submitLeave({
        ...leaveForm,
        submittedBy: user?.id ?? 'admin',
      });
      addNotification({ type: 'success', title: 'Izin berhasil diajukan.' });
      setLeaveForm({ employeeId: '', date: '', reason: '' });
      setLeaveErrors({});
      void fetchData();
    } catch (err) {
      const error = err as Error & { field?: string };
      if (error.field) {
        setLeaveErrors((prev) => ({ ...prev, [error.field!]: error.message }));
      } else {
        addNotification({ type: 'error', title: error.message });
      }
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const validateCorrection = (): boolean => {
    const errors: Record<string, string> = {};
    if (!correctionForm.employeeId) errors.employeeId = 'Pilih karyawan.';
    if (!correctionForm.date) errors.date = 'Tanggal wajib diisi.';
    if (!correctionForm.reason.trim() || correctionForm.reason.trim().length < 5) {
      errors.reason = 'Alasan minimal 5 karakter.';
    }
    setCorrectionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCorrection()) return;

    setIsSubmittingCorrection(true);
    try {
      // Find attendance record for the date
      let attendanceRecordId = correctionForm.attendanceRecordId;
      if (!attendanceRecordId) {
        const records = await getAttendanceRecords({
          startDate: correctionForm.date,
          endDate: correctionForm.date,
          employeeId: correctionForm.employeeId,
        });
        const record = records.find(
          (r) => r.employeeId === correctionForm.employeeId && r.date === correctionForm.date
        );
        attendanceRecordId = record?.id ?? `new-${Date.now()}`;
      }

      await submitCorrection({
        attendanceRecordId,
        employeeId: correctionForm.employeeId,
        date: correctionForm.date,
        correctedCheckIn: correctionForm.correctedCheckIn
          ? new Date(`${correctionForm.date}T${correctionForm.correctedCheckIn}`)
          : null,
        correctedCheckOut: correctionForm.correctedCheckOut
          ? new Date(`${correctionForm.date}T${correctionForm.correctedCheckOut}`)
          : null,
        reason: correctionForm.reason,
        correctedBy: user?.id ?? 'admin',
      });

      addNotification({ type: 'success', title: 'Koreksi berhasil disimpan.' });
      setCorrectionForm({
        employeeId: '',
        date: '',
        attendanceRecordId: '',
        correctedCheckIn: '',
        correctedCheckOut: '',
        reason: '',
      });
      setCorrectionErrors({});
      void fetchData();
    } catch (err) {
      const error = err as Error & { field?: string };
      if (error.field) {
        setCorrectionErrors((prev) => ({ ...prev, [error.field!]: error.message }));
      } else {
        addNotification({ type: 'error', title: error.message });
      }
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const activeEmployees = employees.filter((e) => e.status === 'active');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Izin & Koreksi</h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          Kelola pengajuan izin dan koreksi kehadiran karyawan.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1 w-fit">
        <button
          onClick={() => setActiveTab('leave')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'leave'
              ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Pengajuan Izin
        </button>
        <button
          onClick={() => setActiveTab('correction')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'correction'
              ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Koreksi Absensi
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={80} className="w-full" rounded="lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6">
            {activeTab === 'leave' ? (
              <>
                <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
                  Form Pengajuan Izin
                </h2>
                <form onSubmit={(e) => void handleLeaveSubmit(e)} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Karyawan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={leaveForm.employeeId}
                      onChange={(e) => setLeaveForm((f) => ({ ...f, employeeId: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih karyawan...</option>
                      {activeEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.nik})
                        </option>
                      ))}
                    </select>
                    {leaveErrors.employeeId && (
                      <p className="text-xs text-red-600">{leaveErrors.employeeId}</p>
                    )}
                  </div>
                  <Input
                    label="Tanggal"
                    type="date"
                    value={leaveForm.date}
                    onChange={(e) => setLeaveForm((f) => ({ ...f, date: e.target.value }))}
                    error={leaveErrors.date}
                    required
                    fullWidth
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Alasan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
                      placeholder="Jelaskan alasan izin (minimal 10 karakter)..."
                      rows={3}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    {leaveErrors.reason && (
                      <p className="text-xs text-red-600">{leaveErrors.reason}</p>
                    )}
                  </div>
                  <Button type="submit" isLoading={isSubmittingLeave} fullWidth>
                    Ajukan Izin
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
                  Form Koreksi Absensi
                </h2>
                <form onSubmit={(e) => void handleCorrectionSubmit(e)} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Karyawan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={correctionForm.employeeId}
                      onChange={(e) => setCorrectionForm((f) => ({ ...f, employeeId: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih karyawan...</option>
                      {activeEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.nik})
                        </option>
                      ))}
                    </select>
                    {correctionErrors.employeeId && (
                      <p className="text-xs text-red-600">{correctionErrors.employeeId}</p>
                    )}
                  </div>
                  <Input
                    label="Tanggal"
                    type="date"
                    value={correctionForm.date}
                    onChange={(e) => setCorrectionForm((f) => ({ ...f, date: e.target.value }))}
                    error={correctionErrors.date}
                    required
                    fullWidth
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Waktu Masuk (Koreksi)"
                      type="time"
                      value={correctionForm.correctedCheckIn}
                      onChange={(e) => setCorrectionForm((f) => ({ ...f, correctedCheckIn: e.target.value }))}
                      fullWidth
                    />
                    <Input
                      label="Waktu Keluar (Koreksi)"
                      type="time"
                      value={correctionForm.correctedCheckOut}
                      onChange={(e) => setCorrectionForm((f) => ({ ...f, correctedCheckOut: e.target.value }))}
                      fullWidth
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Alasan Koreksi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={correctionForm.reason}
                      onChange={(e) => setCorrectionForm((f) => ({ ...f, reason: e.target.value }))}
                      placeholder="Jelaskan alasan koreksi..."
                      rows={3}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    {correctionErrors.reason && (
                      <p className="text-xs text-red-600">{correctionErrors.reason}</p>
                    )}
                  </div>
                  <Button type="submit" isLoading={isSubmittingCorrection} fullWidth>
                    Simpan Koreksi
                  </Button>
                </form>
              </>
            )}
          </div>

          {/* History */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
              {activeTab === 'leave' ? 'Riwayat Izin' : 'Riwayat Koreksi'}
            </h2>

            {activeTab === 'leave' ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {leaveRecords.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-tertiary)]">Belum ada pengajuan izin.</p>
                ) : (
                  leaveRecords
                    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                    .map((leave) => {
                      const emp = employees.find((e) => e.id === leave.employeeId);
                      return (
                        <div
                          key={leave.id}
                          className="rounded-lg border border-[var(--color-border)] p-3 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-[var(--color-text-primary)]">
                              {emp?.fullName ?? leave.employeeId}
                            </p>
                            <Badge variant="leave">Izin</Badge>
                          </div>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {leave.date} — {leave.reason}
                          </p>
                          <p className="text-xs text-[var(--color-text-disabled)]">
                            Diajukan: {format(new Date(leave.submittedAt), 'd MMM yyyy HH:mm', { locale: idLocale })}
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {correctionRecords.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-tertiary)]">Belum ada koreksi absensi.</p>
                ) : (
                  correctionRecords
                    .sort((a, b) => new Date(b.correctedAt).getTime() - new Date(a.correctedAt).getTime())
                    .map((correction) => {
                      const emp = employees.find((e) => e.id === correction.employeeId);
                      return (
                        <div
                          key={correction.id}
                          className="rounded-lg border border-[var(--color-border)] p-3 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-[var(--color-text-primary)]">
                              {emp?.fullName ?? correction.employeeId}
                            </p>
                            <Badge variant="warning">Koreksi</Badge>
                          </div>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {correction.date} — {correction.reason}
                          </p>
                          {correction.correctedCheckIn && (
                            <p className="text-xs text-[var(--color-text-disabled)]">
                              Masuk: {format(new Date(correction.correctedCheckIn), 'HH:mm')} |{' '}
                              Keluar: {correction.correctedCheckOut ? format(new Date(correction.correctedCheckOut), 'HH:mm') : '-'}
                            </p>
                          )}
                          <p className="text-xs text-[var(--color-text-disabled)]">
                            Dikoreksi: {format(new Date(correction.correctedAt), 'd MMM yyyy HH:mm', { locale: idLocale })}
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conflict Warning Modal */}
      <Modal
        isOpen={conflictWarning}
        onClose={() => { setConflictWarning(false); setPendingLeave(null); }}
        title="Konflik Data Absensi"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Karyawan ini sudah memiliki data absensi pada tanggal yang dipilih. Mengajukan izin
            akan menimpa status kehadiran yang ada.
          </p>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Yakin ingin melanjutkan?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => { setConflictWarning(false); setPendingLeave(null); }}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConflictWarning(false);
                if (pendingLeave) {
                  const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                  void handleLeaveSubmit(syntheticEvent, true);
                }
              }}
            >
              Lanjutkan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
