import { useState } from 'react';
import { verifyLocation, OFFICE_LOCATION, MAX_DISTANCE_METERS } from '@shared/utils/geolocationUtils';
import { Button } from './Button';

interface LocationVerifierProps {
  onVerified: (coordinates: { latitude: number; longitude: number }) => void;
  onSkip?: () => void;
}

type Status = 'idle' | 'checking' | 'success' | 'failed' | 'out_of_range';

export function LocationVerifier({ onVerified, onSkip }: LocationVerifierProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async () => {
    setStatus('checking');
    setErrorMsg('');

    const result = await verifyLocation();

    if (!result.success) {
      setStatus('failed');
      setErrorMsg(result.error ?? 'Gagal mendapatkan lokasi.');
      return;
    }

    setDistance(result.distance ?? null);

    if (!result.withinRange) {
      setStatus('out_of_range');
      return;
    }

    setStatus('success');
    if (result.coordinates) {
      onVerified(result.coordinates);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">Verifikasi Lokasi</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Harus dalam radius {MAX_DISTANCE_METERS}m dari {OFFICE_LOCATION.name}
          </p>
        </div>
      </div>

      {/* Status */}
      {status === 'idle' && (
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Klik tombol di bawah untuk memverifikasi lokasi Anda sebelum absensi.
        </p>
      )}

      {status === 'checking' && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Mendapatkan lokasi GPS...
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>
            Lokasi terverifikasi ✓{' '}
            {distance !== null && (
              <span className="font-medium">({distance}m dari kantor)</span>
            )}
          </span>
        </div>
      )}

      {status === 'out_of_range' && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <p className="font-semibold">Di luar jangkauan</p>
          <p className="mt-0.5">
            Anda berada {distance !== null ? `${distance}m` : 'terlalu jauh'} dari kantor.
            Maksimal {MAX_DISTANCE_METERS}m dari {OFFICE_LOCATION.name}.
          </p>
        </div>
      )}

      {status === 'failed' && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <p className="font-semibold">Gagal mendapatkan lokasi</p>
          <p className="mt-0.5">{errorMsg}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {status !== 'success' && (
          <Button
            variant="primary"
            onClick={() => void handleVerify()}
            isLoading={status === 'checking'}
            disabled={status === 'checking'}
            className="flex-1"
          >
            {status === 'idle' ? 'Verifikasi Lokasi' : 'Coba Lagi'}
          </Button>
        )}
        {onSkip && status !== 'success' && (
          <Button variant="secondary" onClick={onSkip} disabled={status === 'checking'}>
            Lewati
          </Button>
        )}
      </div>
    </div>
  );
}
