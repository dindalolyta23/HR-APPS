import { useEffect, useState } from 'react';
import { generateQRCode, downloadQRCodePNG } from '../services/qrService';
import { Button } from '@shared/components/ui/Button';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { useAuthStore } from '@features/auth/store/authStore';
import { useUIStore } from '@shared/stores/uiStore';
import type { QRCodeData } from '@shared/types';

export default function MyQRPage() {
  const user = useAuthStore((s) => s.user);
  const addNotification = useUIStore((s) => s.addNotification);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.employeeId) {
      setIsLoading(false);
      return;
    }

    generateQRCode(user.employeeId)
      .then((data) => {
        setQrData(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user?.employeeId]);

  const handleDownload = async () => {
    if (!qrData || !user) return;
    try {
      await downloadQRCodePNG(qrData.token, `QR_${user.name}`);
      addNotification({ type: 'success', title: 'QR Code berhasil diunduh.' });
    } catch {
      addNotification({ type: 'error', title: 'Gagal mengunduh QR Code.' });
    }
  };

  if (!user?.employeeId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">QR Code Saya</h1>
        <p className="mt-4 text-sm text-[var(--color-text-tertiary)]">
          Akun Anda belum terhubung dengan data karyawan. Hubungi administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">QR Code Saya</h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          Gunakan QR Code ini untuk absensi masuk dan keluar.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-8 space-y-6 w-full max-w-sm">
          <div className="text-center">
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">{user.name}</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">QR Code Absensi</p>
          </div>

          <div className="flex justify-center">
            {isLoading ? (
              <Skeleton height={300} width={300} rounded="lg" />
            ) : error ? (
              <div className="flex h-[300px] w-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <svg
                  className="h-10 w-10 text-[var(--color-text-tertiary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-center text-[var(--color-text-tertiary)] px-4">{error}</p>
              </div>
            ) : qrData?.qrDataUrl ? (
              <img
                src={qrData.qrDataUrl}
                alt={`QR Code absensi untuk ${user.name}`}
                className="h-[300px] w-[300px] rounded-lg border border-[var(--color-border)]"
              />
            ) : null}
          </div>

          <div className="space-y-3">
            <Button
              fullWidth
              onClick={() => void handleDownload()}
              disabled={!qrData || isLoading}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              Unduh QR Code (PNG)
            </Button>

            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Petunjuk:</strong> Tunjukkan QR Code ini kepada petugas atau arahkan ke
                scanner saat absensi masuk dan keluar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
