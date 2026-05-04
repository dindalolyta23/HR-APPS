import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployee } from '../services/employeeService';
import { generateQRCode, regenerateQRToken, downloadQRCodePNG } from '../services/qrService';
import { Button } from '@shared/components/ui/Button';
import { Badge } from '@shared/components/ui/Badge';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { Modal } from '@shared/components/ui/Modal';
import { useUIStore } from '@shared/stores/uiStore';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Employee, QRCodeData } from '@shared/types';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addNotification = useUIStore((s) => s.addNotification);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [emp] = await Promise.all([getEmployee(id)]);
      setEmployee(emp);

      // Load QR code
      setIsQrLoading(true);
      try {
        const qr = await generateQRCode(id);
        setQrData(qr);
      } catch {
        // QR load failure is non-critical
      } finally {
        setIsQrLoading(false);
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRegenerate = async () => {
    if (!id) return;
    setIsRegenerating(true);
    try {
      const newQr = await regenerateQRToken(id);
      setQrData(newQr);
      addNotification({ type: 'success', title: 'QR Code berhasil diperbarui.' });
      setIsRegenerateModalOpen(false);
    } catch (err) {
      const e = err as Error;
      addNotification({ type: 'error', title: e.message });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!qrData || !employee) return;
    try {
      await downloadQRCodePNG(qrData.token, `QR_${employee.nik}_${employee.fullName}`);
      addNotification({ type: 'success', title: 'QR Code berhasil diunduh.' });
    } catch {
      addNotification({ type: 'error', title: 'Gagal mengunduh QR Code.' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton height={32} className="w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton height={200} className="w-full" rounded="lg" />
          <Skeleton height={200} className="w-full" rounded="lg" />
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <p className="text-[var(--color-text-tertiary)]">{error ?? 'Karyawan tidak ditemukan.'}</p>
        <Button variant="secondary" className="mt-4" onClick={() => void navigate('/employees')}>
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void navigate('/employees')}
          leftIcon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
        >
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Detail Karyawan
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Info */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Informasi Karyawan
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-2xl font-bold">
              {employee.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                {employee.fullName}
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)]">{employee.position}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">NIK</p>
              <p className="font-mono font-medium text-[var(--color-text-primary)]">{employee.nik}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Departemen</p>
              <p className="font-medium text-[var(--color-text-primary)]">{employee.department}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Status</p>
              <Badge variant={employee.status === 'active' ? 'success' : 'default'}>
                {employee.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Bergabung</p>
              <p className="font-medium text-[var(--color-text-primary)]">
                {format(new Date(employee.createdAt), 'd MMM yyyy', { locale: idLocale })}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">QR Code</h2>

          <div className="flex flex-col items-center gap-4">
            {isQrLoading ? (
              <Skeleton height={300} width={300} rounded="lg" />
            ) : qrData?.qrDataUrl ? (
              <img
                src={qrData.qrDataUrl}
                alt={`QR Code untuk ${employee.fullName}`}
                className="h-[300px] w-[300px] rounded-lg border border-[var(--color-border)]"
              />
            ) : (
              <div className="flex h-[300px] w-[300px] items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <p className="text-sm text-[var(--color-text-tertiary)]">QR Code tidak tersedia</p>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => void handleDownload()}
                disabled={!qrData}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                Unduh PNG
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsRegenerateModalOpen(true)}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                Regenerasi
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Regenerate Confirmation Modal */}
      <Modal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        title="Regenerasi QR Code"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            QR Code lama akan <strong>tidak berlaku</strong> setelah regenerasi. Karyawan harus
            menggunakan QR Code baru untuk absensi.
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Yakin ingin meregenerasi QR Code untuk <strong>{employee.fullName}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsRegenerateModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              isLoading={isRegenerating}
              onClick={() => void handleRegenerate()}
            >
              Regenerasi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
