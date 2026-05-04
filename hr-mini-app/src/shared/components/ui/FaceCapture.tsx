import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from './Button';

interface FaceCaptureProps {
  onCaptured: (imageDataUrl: string) => void;
  onSkip?: () => void;
}

type Status = 'idle' | 'loading_camera' | 'ready' | 'captured' | 'error';

export function FaceCapture({ onCaptured, onSkip }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    setStatus('loading_camera');
    setErrorMsg('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('ready');
    } catch (err) {
      const e = err as Error;
      let msg = 'Gagal mengakses kamera.';
      if (e.name === 'NotAllowedError') msg = 'Izin kamera ditolak. Aktifkan kamera di browser.';
      else if (e.name === 'NotFoundError') msg = 'Kamera tidak ditemukan di perangkat ini.';
      setStatus('error');
      setErrorMsg(msg);
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // Countdown 3..2..1
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);

        const video = videoRef.current!;
        const canvas = canvasRef.current!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Mirror the image (selfie mode)
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        setStatus('captured');
        stopCamera();
      }
    }, 1000);
  }, [stopCamera]);

  const retake = () => {
    setCapturedImage(null);
    setStatus('idle');
  };

  const confirm = () => {
    if (capturedImage) {
      onCaptured(capturedImage);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
          <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">Verifikasi Wajah</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Ambil foto wajah untuk konfirmasi identitas
          </p>
        </div>
      </div>

      {/* Camera / Preview area */}
      <div className="relative overflow-hidden rounded-xl bg-black aspect-video max-h-48 flex items-center justify-center">
        {status === 'idle' && (
          <div className="text-center text-white/60 p-4">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">Klik "Buka Kamera" untuk mulai</p>
          </div>
        )}

        {status === 'loading_camera' && (
          <div className="text-center text-white/60">
            <svg className="mx-auto h-8 w-8 animate-spin mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">Membuka kamera...</p>
          </div>
        )}

        {(status === 'ready' || status === 'loading_camera') && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)', display: status === 'ready' ? 'block' : 'none' }}
            playsInline
            muted
          />
        )}

        {status === 'captured' && capturedImage && (
          <img src={capturedImage} alt="Foto wajah" className="w-full h-full object-cover" />
        )}

        {status === 'error' && (
          <div className="text-center text-red-400 p-4">
            <svg className="mx-auto h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-6xl font-bold text-white drop-shadow-lg">{countdown}</span>
          </div>
        )}

        {/* Face guide overlay */}
        {status === 'ready' && countdown === null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-28 h-36 rounded-full border-2 border-white/60 border-dashed" />
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Status message */}
      {status === 'captured' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Foto berhasil diambil. Konfirmasi untuk melanjutkan.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {status === 'idle' && (
          <>
            <Button variant="primary" onClick={() => void startCamera()} className="flex-1">
              Buka Kamera
            </Button>
            {onSkip && (
              <Button variant="secondary" onClick={onSkip}>
                Lewati
              </Button>
            )}
          </>
        )}

        {status === 'ready' && (
          <Button
            variant="primary"
            onClick={capturePhoto}
            disabled={countdown !== null}
            className="flex-1"
          >
            {countdown !== null ? `Mengambil foto... ${countdown}` : '📸 Ambil Foto'}
          </Button>
        )}

        {status === 'error' && (
          <>
            <Button variant="primary" onClick={() => void startCamera()} className="flex-1">
              Coba Lagi
            </Button>
            {onSkip && (
              <Button variant="secondary" onClick={onSkip}>
                Lewati
              </Button>
            )}
          </>
        )}

        {status === 'captured' && (
          <>
            <Button variant="secondary" onClick={retake}>
              Ulangi
            </Button>
            <Button variant="primary" onClick={confirm} className="flex-1">
              Konfirmasi ✓
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
