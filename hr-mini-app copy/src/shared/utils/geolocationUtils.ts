// ─── Office Location Config ───────────────────────────────────────────────────
// Admin can configure this — default is a placeholder coordinate
export const OFFICE_LOCATION = {
  latitude: -6.2088,   // Jakarta default — ganti sesuai lokasi kantor
  longitude: 106.8456,
  name: 'Kantor Pusat',
};

export const MAX_DISTANCE_METERS = 100; // 100m radius (GPS browser tidak akurat untuk 10m)

// ─── Haversine formula ────────────────────────────────────────────────────────
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface GeolocationResult {
  success: boolean;
  distance?: number;
  withinRange?: boolean;
  coordinates?: { latitude: number; longitude: number };
  error?: string;
}

export async function verifyLocation(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Browser Anda tidak mendukung GPS. Gunakan browser modern.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(
          latitude,
          longitude,
          OFFICE_LOCATION.latitude,
          OFFICE_LOCATION.longitude
        );

        resolve({
          success: true,
          distance: Math.round(distance),
          withinRange: distance <= MAX_DISTANCE_METERS,
          coordinates: { latitude, longitude },
        });
      },
      (error) => {
        let message = 'Gagal mendapatkan lokasi.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Izin lokasi ditolak. Aktifkan GPS di browser Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Lokasi tidak tersedia. Pastikan GPS aktif.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Timeout mendapatkan lokasi. Coba lagi.';
        }
        resolve({ success: false, error: message });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
