# Implementation Tasks — HR Mini App

## Task List

- [x] 1. Setup Proyek dan Infrastruktur
  - [ ] 1.1 Inisialisasi proyek dengan Vite + React + TypeScript (strict mode)
  - [ ] 1.2 Konfigurasi TailwindCSS dengan CSS variables untuk dark/light mode
  - [ ] 1.3 Setup ESLint, Prettier, dan tsconfig.json dengan strict: true
  - [ ] 1.4 Setup Vitest + React Testing Library + fast-check
  - [ ] 1.5 Buat struktur folder feature-first sesuai desain
  - [ ] 1.6 Setup React Router v6 dengan lazy loading per halaman
  - [ ] 1.7 Setup Zustand stores skeleton (authStore, employeeStore, attendanceStore, scheduleStore, reportStore, leaveStore, uiStore)
  - [ ] 1.8 Buat shared UI components: Button, Input, Modal, Badge, Skeleton, Toast, EmptyState, ErrorBoundary
  - [ ] 1.9 Buat AppShell layout dengan Sidebar (desktop) dan BottomNav (mobile < 768px)

- [-] 2. Mock API dan Data Seed (MSW)
  - [ ] 2.1 Install dan konfigurasi MSW untuk browser dan node (testing)
  - [ ] 2.2 Buat seed data: 10+ karyawan dari berbagai departemen, 30 hari attendance records
  - [ ] 2.3 Implementasi helper delay() untuk latensi realistis 200–800ms
  - [ ] 2.4 Buat MSW handlers untuk auth endpoints (POST /api/auth/login, POST /api/auth/logout)
  - [ ] 2.5 Buat MSW handlers untuk employee endpoints (GET/POST /api/employees, PUT/PATCH /api/employees/:id)
  - [ ] 2.6 Buat MSW handlers untuk QR endpoints (GET /api/employees/:id/qr, POST /api/employees/:id/qr/regenerate)
  - [ ] 2.7 Buat MSW handlers untuk attendance endpoints (POST /api/attendance/scan, GET /api/attendance, GET /api/attendance/stats)
  - [ ] 2.8 Buat MSW handlers untuk schedule endpoints (GET/POST /api/schedule/sessions, GET/POST /api/schedule/holidays)
  - [ ] 2.9 Buat MSW handlers untuk leave/correction endpoints (POST /api/leave, POST /api/attendance/correction, GET /api/attendance/:id/audit)

- [ ] 3. Autentikasi dan Otorisasi (Req 7)
  - [ ] 3.1 Implementasi authService: login dengan lockout 5x gagal selama 15 menit, logout, session management
  - [ ] 3.2 Implementasi authStore dengan Zustand: user, session, lockoutInfo
  - [ ] 3.3 Implementasi useAuth hook dengan idle timer auto-logout 30 menit
  - [ ] 3.4 Buat LoginPage dengan LoginForm: email/username input, password input (toggle visibility), remember me checkbox
  - [ ] 3.5 Implementasi ProtectedRoute dan AdminRoute sebagai route guards
  - [ ] 3.6 Simpan sesi di localStorage jika "Ingat Saya" aktif, hapus saat logout
  - [ ] 3.7 Tampilkan countdown timer lockout di LoginForm saat akun terkunci

- [ ] 4. Manajemen Data Karyawan (Req 1)
  - [ ] 4.1 Implementasi employeeService: CRUD karyawan, validasi NIK unik, nonaktifkan karyawan
  - [ ] 4.2 Implementasi employeeStore dengan filter departemen dan status aktif
  - [ ] 4.3 Buat EmployeesPage dengan EmployeeFilterBar (filter departemen + status)
  - [ ] 4.4 Buat EmployeeTable dengan pagination dan EmployeeRow
  - [ ] 4.5 Buat EmployeeFormModal untuk tambah/edit karyawan (nama, NIK, departemen, jabatan)
  - [ ] 4.6 Tampilkan pesan error inline jika NIK duplikat saat submit form
  - [ ] 4.7 Buat EmployeeDetailPage dengan informasi lengkap karyawan

- [ ] 5. Pembuatan dan Distribusi QR Code (Req 2)
  - [ ] 5.1 Implementasi qrService: generate Token_QR terenkripsi (encode/decode round-trip), regenerasi token
  - [ ] 5.2 Buat QRCodeCard component: tampilkan QR code image 300x300px minimum
  - [ ] 5.3 Implementasi download QR code sebagai PNG (resolusi ≥ 300x300px)
  - [ ] 5.4 Implementasi regenerasi QR code: token baru + invalidasi token lama
  - [ ] 5.5 Implementasi cetak massal PDF: semua karyawan aktif dalam satu file PDF (jsPDF)
  - [ ] 5.6 Halaman /my-qr untuk karyawan: tampilkan dan download QR code pribadi

- [ ] 6. Absensi via QR Code (Req 3)
  - [ ] 6.1 Implementasi attendanceService: proses scan, validasi token, cek duplikasi, hitung status (Hadir/Terlambat), kalkulasi durasi kerja
  - [ ] 6.2 Implementasi attendanceStore dengan state todayScan
  - [ ] 6.3 Buat ScannerPage dengan QRScannerWidget menggunakan html5-qrcode (kamera belakang default di mobile)
  - [ ] 6.4 Buat ScanResultCard: tampilkan nama karyawan, waktu, tipe absensi, StatusBadge dalam < 2 detik
  - [ ] 6.5 Tampilkan HolidayBanner dan nonaktifkan scanner saat hari libur
  - [ ] 6.6 Handle semua error state scanner: token invalid, karyawan tidak aktif, duplikasi scan, kamera tidak tersedia
  - [ ] 6.7 Auto-set status "Tidak Hadir" untuk karyawan aktif tanpa absensi di akhir hari kerja (via mock API)

- [ ] 7. Manajemen Sesi Absensi dan Hari Kerja (Req 4)
  - [ ] 7.1 Implementasi scheduleService: CRUD sesi absensi, validasi waktu mulai < waktu selesai, manajemen hari libur
  - [ ] 7.2 Implementasi scheduleStore
  - [ ] 7.3 Buat SchedulePage dengan SessionForm: nama sesi, waktu mulai, waktu selesai, toleransi keterlambatan
  - [ ] 7.4 Tampilkan pesan error jika waktu mulai ≥ waktu selesai saat simpan sesi
  - [ ] 7.5 Buat HolidayCalendar component untuk tambah/hapus hari libur nasional dan cuti bersama
  - [ ] 7.6 Buat WorkdayConfig component untuk konfigurasi hari kerja dalam seminggu

- [ ] 8. Rekap dan Pemantauan Kehadiran (Req 5)
  - [ ] 8.1 Implementasi reportService: ambil rekap dengan filter multi-dimensi, hitung statistik per karyawan
  - [ ] 8.2 Implementasi reportStore dengan chartData untuk grafik
  - [ ] 8.3 Buat ReportsPage dengan ReportFilterBar: DateRangePicker, DepartmentSelect, StatusSelect
  - [ ] 8.4 Buat StatsSummaryCards: total hadir, terlambat, tidak hadir
  - [ ] 8.5 Buat AttendanceChart menggunakan Recharts (bar chart mingguan)
  - [ ] 8.6 Buat AttendanceTable dengan EmployeeAttendanceSummary per karyawan (persentase kehadiran)
  - [ ] 8.7 Buat DailyDetailModal: riwayat harian dengan waktu masuk/keluar, durasi, status, AuditTrailSection
  - [ ] 8.8 Tampilkan indikator warna berbeda untuk setiap Status_Kehadiran
  - [ ] 8.9 Tampilkan skeleton loading saat data sedang dimuat, pesan error + tombol "Coba Lagi" jika gagal
  - [ ] 8.10 Buat halaman /my-attendance untuk karyawan: riwayat kehadiran pribadi

- [ ] 9. Export Data Kehadiran ke Excel (Req 6)
  - [ ] 9.1 Implementasi exportService menggunakan ExcelJS: generate file .xlsx dengan semua kolom wajib
  - [ ] 9.2 Implementasi format nama file otomatis: Rekap_Kehadiran_[Dept]_[Start]_[End].xlsx
  - [ ] 9.3 Buat ExportButton dengan loading state dan progress indicator
  - [ ] 9.4 Handle kasus tidak ada data: generate file dengan header saja + catatan
  - [ ] 9.5 Pastikan file tersedia untuk diunduh dalam < 10 detik untuk data hingga 10.000 baris
  - [ ] 9.6 Terapkan filter departemen pada data yang diekspor

- [ ] 10. Izin dan Koreksi Kehadiran (Req 8)
  - [ ] 10.1 Implementasi leaveService: ajukan izin, koreksi absensi, simpan audit trail lengkap
  - [ ] 10.2 Implementasi leaveStore
  - [ ] 10.3 Buat LeavePage dengan LeaveRequestForm: EmployeeSelect, DatePicker, ReasonInput
  - [ ] 10.4 Tampilkan ConflictWarningModal jika karyawan sudah punya absensi pada tanggal yang sama
  - [ ] 10.5 Buat CorrectionForm: EmployeeSelect, DatePicker, TimeInputs (masuk/keluar), ReasonInput
  - [ ] 10.6 Simpan audit trail koreksi: alasan, ID admin, timestamp — tidak boleh null
  - [ ] 10.7 Tampilkan riwayat koreksi dan izin di DailyDetailModal (AuditTrail component)

- [ ] 11. UI/UX: Dark Mode, Aksesibilitas, Responsivitas (Req 6 dari spec pertama)
  - [ ] 11.1 Implementasi Theme_Engine: toggle dark/light mode, baca prefers-color-scheme sebagai default
  - [ ] 11.2 Simpan preferensi tema di localStorage
  - [ ] 11.3 Pastikan semua komponen mendukung dark mode via CSS variables + Tailwind dark: prefix
  - [ ] 11.4 Tambahkan atribut ARIA pada semua elemen interaktif (aria-label, aria-live, role)
  - [ ] 11.5 Pastikan rasio kontras warna ≥ 4.5:1 di kedua tema (WCAG 2.1 AA)
  - [ ] 11.6 Implementasi navigasi keyboard penuh: focus management, skip links, trap focus di modal
  - [ ] 11.7 Pastikan layout responsif dari 320px hingga 2560px
  - [ ] 11.8 Tampilkan BottomNav pada layar < 768px, Sidebar pada layar ≥ 768px
  - [ ] 11.9 Implementasi offline banner dan nonaktifkan aksi yang butuh jaringan saat offline
  - [ ] 11.10 Optimasi rendering: React.memo untuk tabel berat, useMemo untuk kalkulasi statistik, virtual scrolling untuk > 100 baris

- [ ] 12. Property-Based Tests dan Unit Tests
  - [ ] 12.1 Tulis PBT untuk P1 & P2: keunikan token QR dan round-trip encode/decode (200 iterasi)
  - [ ] 12.2 Tulis PBT untuk P3 & P5: invariant token saat update, penolakan NIK duplikat (100 iterasi)
  - [ ] 12.3 Tulis PBT untuk P4: filter karyawan mengembalikan hasil konsisten (100 iterasi)
  - [ ] 12.4 Tulis PBT untuk P6 & P7: karyawan tidak aktif ditolak, regenerasi QR batalkan token lama (100 iterasi)
  - [ ] 12.5 Tulis PBT untuk P8 & P9: resolusi PNG ≥ 300x300, kelengkapan PDF cetak massal (100 iterasi)
  - [ ] 12.6 Tulis PBT untuk P10, P11, P12: idempotency scan, klasifikasi status, kalkulasi durasi kerja (200 iterasi)
  - [ ] 12.7 Tulis PBT untuk P13 & P14: penolakan scan hari libur, validasi waktu sesi (100 iterasi)
  - [ ] 12.8 Tulis PBT untuk P15 & P16: filter rekap konsisten, invariant statistik kehadiran (100 iterasi)
  - [ ] 12.9 Tulis PBT untuk P17–P20: kolom wajib Excel, konsistensi baris, filter departemen, format nama file (100 iterasi)
  - [ ] 12.10 Tulis PBT untuk P21 & P22: role-based access control, proteksi rute (100 iterasi)
  - [ ] 12.11 Tulis PBT untuk P23 & P24: audit trail koreksi, perubahan status izin (100 iterasi)
  - [ ] 12.12 Tulis unit tests untuk LoginForm, lockout, auto-logout
  - [ ] 12.13 Tulis unit tests untuk EmployeeTable, EmployeeForm, QRScanner, ScanResultCard
  - [ ] 12.14 Tulis unit tests untuk AttendanceChart, ExportButton, SessionForm, LeaveForm, CorrectionForm
  - [ ] 12.15 Pastikan code coverage ≥ 70% untuk lines, functions, branches, statements

- [ ] 13. Deployment dan Dokumentasi
  - [ ] 13.1 Konfigurasi build Vite untuk production (code splitting, tree shaking)
  - [ ] 13.2 Pastikan skor Lighthouse Performance ≥ 85 pada simulasi jaringan 4G
  - [ ] 13.3 Deploy ke Vercel atau Netlify dengan environment variables yang diperlukan
  - [ ] 13.4 Tulis README.md: cara menjalankan proyek, arsitektur, keputusan teknis, daftar fitur, link demo
