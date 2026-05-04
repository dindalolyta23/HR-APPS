import QRCode from 'qrcode';
import type { QRCodeData, QRTokenPayload } from '@shared/types';
import { supabase } from '@/lib/supabase';

/**
 * Encodes a QR token payload into a base64 string token.
 */
export function encodeQRToken(payload: QRTokenPayload): string {
  return btoa(JSON.stringify(payload));
}

/**
 * Decodes a QR token string back to its payload.
 * Throws if the token is invalid.
 */
export function decodeQRToken(token: string): QRTokenPayload {
  try {
    const decoded = JSON.parse(atob(token)) as QRTokenPayload;
    if (!decoded.employeeId || !decoded.nik) {
      throw new Error('Invalid token payload');
    }
    return decoded;
  } catch {
    throw new Error('Token QR tidak valid.');
  }
}

/**
 * Generates a QR code PNG data URL from a token string.
 */
export async function generateQRDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Generates QR code data for an employee from Supabase.
 */
export async function generateQRCode(employeeId: string): Promise<QRCodeData> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, qr_token')
    .eq('id', employeeId)
    .single();

  if (error || !data) throw new Error('Karyawan tidak ditemukan.');

  const token = data.qr_token as string;
  const qrDataUrl = await generateQRDataUrl(token);

  return {
    employeeId: data.id as string,
    token,
    qrDataUrl,
    generatedAt: new Date(),
  };
}

/**
 * Regenerates a QR token for an employee, invalidating the old one.
 */
export async function regenerateQRToken(employeeId: string): Promise<QRCodeData> {
  const { data: emp, error: fetchError } = await supabase
    .from('employees')
    .select('id, nik, qr_token, qr_version')
    .eq('id', employeeId)
    .single();

  if (fetchError || !emp) throw new Error('Karyawan tidak ditemukan.');

  // Determine new version
  let currentVersion = (emp.qr_version as number) ?? 1;
  try {
    const decoded = decodeQRToken(emp.qr_token as string);
    currentVersion = (decoded.version ?? currentVersion) + 1;
  } catch {
    currentVersion = currentVersion + 1;
  }

  const newToken = btoa(
    JSON.stringify({
      employeeId: emp.id,
      nik: emp.nik,
      issuedAt: Date.now(),
      version: currentVersion,
    })
  );

  const { error: updateError } = await supabase
    .from('employees')
    .update({
      qr_token: newToken,
      qr_version: currentVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', employeeId);

  if (updateError) throw new Error(updateError.message);

  const qrDataUrl = await generateQRDataUrl(newToken);

  return {
    employeeId: emp.id as string,
    token: newToken,
    qrDataUrl,
    generatedAt: new Date(),
  };
}

/**
 * Downloads a QR code as a PNG file.
 * Ensures minimum 300x300 resolution.
 */
export async function downloadQRCodePNG(
  token: string,
  filename: string
): Promise<void> {
  const dataUrl = await QRCode.toDataURL(token, {
    width: 400,
    margin: 2,
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
