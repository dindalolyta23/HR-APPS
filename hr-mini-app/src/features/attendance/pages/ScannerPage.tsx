import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { processScan } from '../services/attendanceService';
import { getHolidays } from '@features/schedule/services/scheduleService';
import { Badge } from '@shared/components/ui/Badge';
import { Button } from '@shared/components/ui/Button';
import { LocationVerifier } from '@shared/components/ui/LocationVerifier';
import { FaceCapture } from '@shared/components/ui/FaceCapture';
import { useUIStore } from '@shared/stores/uiStore';
import type { Holiday, ScanResult } from '@shared/types';

// ─── Step types ───────────────────────────────────────────────────────────────
type Step = 'location' | 'face' | 'scan' | 'result';

// ─── Scan Result Card ─────────────────────────────────────────────────────────
function ScanResultCard({ result }: { result: ScanResult }) {
  const getVariant = () => {
    if (!result.success) {
      if (result.type === 'duplicate') return 'warning';
      return 'danger';
    }
    if (result.status === 'late') return 'warning';
    return 'success';
  };

  const bgColors: Record<string, string> = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    danger: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  };

  const iconColors: Record<string, string> = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  const variant = getVariant();

  return (
    <div className={`rounded-xl border p-6 ${bgColors[variant] ?? bgColors.danger}`} role="alert" aria-live="polite">
      <div className="flex items-start gap-4">
        <div className={`shrink-0 ${iconColors[variant] ?? iconColors.danger}`}>
          {result.success ? (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {result.employeeName && (
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">{result.employeeName}</p>
          )}
          <p className="text-sm text-[var(--color-text-secondary)]">{result.message}</p>
          {result.timestamp && (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {new Date(result.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
          {result.status && (
            <div className="pt-1">
              <Badge variant={result.status === 'present' ? 'present' : result.status === 'late' ? 'late' : result.status === 'absent' ? 'absent' : 'leave'} dot>
                {result.type === 'check-in' ? 'Absensi Masuk' : 'Absensi Keluar'} —{' '}
                {result.status === 'present' ? 'Hadir' : result.status === 'late' ? 'Terlambat' : result.status === 'absent' ? 'Tidak Hadir' : 'Izin'}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string; icon: string }[] = [
    { key: 'location', label: 'Lokasi', icon: '📍' },
    { key: 'face', label: 'Wajah', icon: '🤳' },
    { key: 'scan', label: 'Scan QR', icon: '📷' },
  ];

  const order: Step[] = ['location', 'face', 'scan', 'result'];
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, idx) => {
        const stepIdx = order.indexOf(step.key);
        const isDone = stepIdx < currentIdx;
        const isActive = step.key === current;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              isDone ? 'bg-green-500 text-white' :
              isActive ? 'bg-blue-500 text-white' :
              'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
            }`}>
              {isDone ? '✓' : step.icon}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`h-px w-6 ${stepIdx < currentIdx ? 'bg-green-500' : 'bg-[var(--color-border)]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ScannerPage() {
  const addNotification = useUIStore((s) => s.addNotification);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [step, setStep] = useState<Step>('location');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayHoliday, setTodayHoliday] = useState<Holiday | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0] ?? '';

  useEffect(() => {
    getHolidays().then((holidays) => {
      const holiday = holidays.find((h) => h.date === today);
      setTodayHoliday(holiday ?? null);
    }).catch(() => {});
  }, [today]);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const result = await processScan(decodedText);
      setScanResult(result);
      setStep('result');

      if (result.success) {
        addNotification({ type: 'success', title: result.message, duration: 3000 });
      }
    } catch {
      setScanResult({ success: false, type: 'invalid', message: 'Terjadi kesalahan saat memproses scan.' });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, addNotification]);

  // Init QR scanner when on scan step
  useEffect(() => {
    if (step !== 'scan' || todayHoliday) return;

    const scannerId = 'qr-scanner-container';

    try {
      const scanner = new Html5QrcodeScanner(
        scannerId,
        { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], rememberLastUsedCamera: true },
        false
      );

      scanner.render(
        (decodedText) => { void handleScanSuccess(decodedText); },
        (errorMessage) => {
          if (errorMessage.includes('No MultiFormat Readers')) return;
          if (errorMessage.includes('NotFoundException')) return;
        }
      );

      scannerRef.current = scanner;
    } catch {
      setScannerError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [step, todayHoliday, handleScanSuccess]);

  const handleReset = () => {
    setScanResult(null);
    setLocationCoords(null);
    setFaceImage(null);
    setStep('location');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Scanner Absensi</h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            Verifikasi lokasi, wajah, lalu scan QR Code untuk absensi.
          </p>
        </div>
        {step !== 'result' && <StepIndicator current={step} />}
      </div>

      {/* Holiday Banner */}
      {todayHoliday && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <svg className="h-5 w-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-300">Hari Libur: {todayHoliday.name}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Scanner dinonaktifkan karena hari ini adalah hari libur.</p>
          </div>
        </div>
      )}

      {!todayHoliday && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Steps */}
          <div className="space-y-4">
            {/* Step 1: Location */}
            {step === 'location' && (
              <LocationVerifier
                onVerified={(coords) => {
                  setLocationCoords(coords);
                  setStep('face');
                }}
                onSkip={() => setStep('face')}
              />
            )}

            {/* Step 2: Face */}
            {step === 'face' && (
              <div className="space-y-3">
                {locationCoords && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    <span>✓</span> Lokasi terverifikasi
                  </div>
                )}
                <FaceCapture
                  onCaptured={(img) => {
                    setFaceImage(img);
                    setStep('scan');
                  }}
                  onSkip={() => setStep('scan')}
                />
              </div>
            )}

            {/* Step 3: QR Scan */}
            {step === 'scan' && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6 space-y-4">
                {/* Verification summary */}
                <div className="flex gap-2 flex-wrap">
                  {locationCoords && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      ✓ Lokasi
                    </span>
                  )}
                  {faceImage && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      ✓ Wajah
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Scan QR Code</h2>
                <p className="text-sm text-[var(--color-text-tertiary)]">Arahkan kamera ke QR Code karyawan.</p>

                {scannerError ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg bg-[var(--color-bg-secondary)]">
                    <p className="text-sm text-center text-[var(--color-text-tertiary)] px-4">{scannerError}</p>
                  </div>
                ) : (
                  <div id="qr-scanner-container" className="w-full" />
                )}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memproses scan...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Result / Preview */}
          <div className="space-y-4">
            {step === 'result' && scanResult ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Hasil Absensi</h2>
                <ScanResultCard result={scanResult} />
                {faceImage && (
                  <div className="rounded-xl overflow-hidden border border-[var(--color-border)]">
                    <p className="px-3 py-2 text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-secondary)]">Foto verifikasi</p>
                    <img src={faceImage} alt="Foto verifikasi" className="w-full max-h-40 object-cover" />
                  </div>
                )}
                <Button variant="secondary" fullWidth onClick={handleReset}>
                  Absensi Berikutnya
                </Button>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div className="text-4xl">
                  {step === 'location' ? '📍' : step === 'face' ? '🤳' : '📷'}
                </div>
                <p className="text-sm text-[var(--color-text-tertiary)] text-center px-4">
                  {step === 'location' && 'Verifikasi lokasi Anda terlebih dahulu'}
                  {step === 'face' && 'Ambil foto wajah untuk konfirmasi identitas'}
                  {step === 'scan' && 'Siap scan QR Code karyawan'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
