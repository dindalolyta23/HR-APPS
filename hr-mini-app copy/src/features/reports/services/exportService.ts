import ExcelJS from 'exceljs';
import type { ExportConfig } from '@shared/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

function formatTime(date: Date | null): string {
  if (!date) return '-';
  return format(new Date(date), 'HH:mm', { locale: idLocale });
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} jam ${m} menit`;
}

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    present: 'Hadir',
    late: 'Terlambat',
    absent: 'Tidak Hadir',
    leave: 'Izin',
  };
  return map[status] ?? status;
}

/**
 * Exports attendance data to Excel (.xlsx).
 */
export async function exportToExcel(config: ExportConfig): Promise<void> {
  // Fetch employees
  let empQuery = supabase
    .from('employees')
    .select('id, nik, full_name, department');

  if (config.department && config.department !== 'all') {
    empQuery = empQuery.eq('department', config.department);
  }

  const { data: employees, error: empError } = await empQuery;
  if (empError) throw new Error(empError.message);

  const empMap = new Map(
    (employees ?? []).map((e) => [e.id as string, e])
  );

  // Fetch attendance records
  let recQuery = supabase
    .from('attendance_records')
    .select('*')
    .gte('date', config.startDate)
    .lte('date', config.endDate)
    .order('date', { ascending: true });

  if (config.department && config.department !== 'all') {
    const ids = Array.from(empMap.keys());
    if (ids.length === 0) {
      // No employees in this department — still create empty workbook
    } else {
      recQuery = recQuery.in('employee_id', ids);
    }
  }

  const { data: records, error: recError } = await recQuery;
  if (recError) throw new Error(recError.message);

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HR Mini App';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Rekap Kehadiran');

  // Define columns
  worksheet.columns = [
    { header: 'NIK', key: 'nik', width: 15 },
    { header: 'Nama Karyawan', key: 'fullName', width: 25 },
    { header: 'Departemen', key: 'department', width: 20 },
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Waktu Masuk', key: 'checkInTime', width: 15 },
    { header: 'Waktu Keluar', key: 'checkOutTime', width: 15 },
    { header: 'Durasi Kerja', key: 'workDuration', width: 18 },
    { header: 'Status Kehadiran', key: 'status', width: 18 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 20;

  const filteredRecords = (records ?? []).filter((r) => empMap.has(r.employee_id as string));

  if (filteredRecords.length === 0) {
    worksheet.addRow({
      nik: 'Tidak ada data untuk periode dan filter yang dipilih.',
    });
  } else {
    for (const record of filteredRecords) {
      const emp = empMap.get(record.employee_id as string);
      if (!emp) continue;

      const row = worksheet.addRow({
        nik: emp.nik,
        fullName: emp.full_name,
        department: emp.department,
        date: record.date,
        checkInTime: formatTime(record.check_in_time ? new Date(record.check_in_time as string) : null),
        checkOutTime: formatTime(record.check_out_time ? new Date(record.check_out_time as string) : null),
        workDuration: formatDuration(record.work_duration_minutes as number | null),
        status: translateStatus(record.status as string),
      });

      // Color-code status
      const statusCell = row.getCell('status');
      switch (record.status) {
        case 'present':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          statusCell.font = { color: { argb: 'FF065F46' } };
          break;
        case 'late':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          statusCell.font = { color: { argb: 'FF92400E' } };
          break;
        case 'absent':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          statusCell.font = { color: { argb: 'FF991B1B' } };
          break;
        case 'leave':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
          statusCell.font = { color: { argb: 'FF3730A3' } };
          break;
      }
    }
  }

  // Add borders
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  const filename = config.filename || generateFilename(config);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates the filename in format: Rekap_Kehadiran_[Dept]_[Start]_[End].xlsx
 */
export function generateFilename(
  config: Pick<ExportConfig, 'startDate' | 'endDate' | 'department'>
): string {
  const dept = config.department && config.department !== 'all' ? config.department : 'Semua';
  const start = config.startDate.replace(/-/g, '');
  const end = config.endDate.replace(/-/g, '');
  return `Rekap_Kehadiran_${dept}_${start}_${end}.xlsx`;
}
