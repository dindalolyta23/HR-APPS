# Dokumen Requirements

## Pendahuluan

Fitur ini mencakup integrasi Supabase sebagai backend nyata untuk HR Mini App — aplikasi absensi karyawan berbasis QR code yang sebelumnya berjalan sepenuhnya di sisi frontend dengan MSW sebagai mock API. Integrasi ini menggantikan MSW dengan Supabase (PostgreSQL + Auth + Storage + Edge Functions) sambil mempertahankan kontrak antarmuka yang sudah ada di layer service FE sehingga tidak ada perubahan breaking pada komponen React dan Zustand store yang sudah dibangun.

Tujuan utama integrasi ini adalah: (1) menyediakan persistensi data nyata lintas sesi dan perangkat, (2) mengamankan akses data dengan Row Level Security berbasis peran, (3) memindahkan logika bisnis kompleks ke Edge Functions agar tidak dapat dimanipulasi dari sisi klien, dan (4) memungkinkan real-time update pada tampilan kehadiran tanpa polling manual.

---

## Glosarium

- **Supabase**: Platform Backend-as-a-Service berbasis PostgreSQL yang menyediakan database, autentikasi, storage, dan serverless functions
- **Supabase_Client**: Library JavaScript `@supabase/supabase-js` yang diinisialisasi di FE sebagai pengganti MSW
- **Edge_Function**: Fungsi serverless Deno yang berjalan di infrastruktur Supabase, digunakan untuk logika bisnis yang tidak boleh dieksekusi di sisi klien
- **RLS**: Row Level Security — mekanisme PostgreSQL untuk membatasi akses baris data berdasarkan identitas pengguna yang sedang login
- **Supabase_Auth**: Layanan autentikasi bawaan Supabase yang mengelola sesi, token JWT, dan metadata pengguna
- **JWT**: JSON Web Token — token terenkripsi yang diterbitkan Supabase_Auth dan digunakan untuk mengidentifikasi pengguna pada setiap request
- **Service_Layer**: Kumpulan file TypeScript di FE (`authService.ts`, `employeeService.ts`, dst.) yang menjadi satu-satunya titik akses ke backend
- **MSW**: Mock Service Worker — library yang sebelumnya digunakan untuk mensimulasikan API di browser, akan dihapus setelah migrasi selesai
- **QR_Token**: String unik terenkripsi yang tertanam dalam QR code setiap karyawan, digunakan sebagai identitas saat scan absensi
- **Bucket**: Unit penyimpanan file di Supabase Storage, setara dengan folder root
- **Seed_Data**: Data awal yang dimasukkan ke database untuk keperluan pengembangan dan demonstrasi
- **Realtime_Channel**: Koneksi WebSocket ke Supabase yang mengirimkan perubahan data secara langsung ke klien yang berlangganan
- **Admin**: Pengguna dengan peran `admin` yang memiliki akses penuh ke seluruh data dan fitur manajemen
- **Karyawan**: Pengguna dengan peran `employee` yang hanya dapat mengakses data pribadi
- **Migration_File**: File SQL bernomor urut yang mendefinisikan perubahan skema database secara bertahap
- **Sistem**: HR Mini App secara keseluruhan, mencakup FE React dan BE Supabase

---

## Requirements

### Requirement 1: Setup dan Konfigurasi Supabase

**User Story:** Sebagai Developer, saya ingin mengonfigurasi Supabase sebagai backend HR Mini App, sehingga seluruh tim dapat menjalankan aplikasi dengan backend nyata hanya dengan menyalin file `.env`.

#### Acceptance Criteria

1. THE Sistem SHALL membaca konfigurasi koneksi Supabase dari environment variables `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` yang didefinisikan dalam file `.env.local`.
2. WHEN file `.env.local` tidak ditemukan atau salah satu environment variable tidak terdefinisi, THE Supabase_Client SHALL melempar error yang deskriptif pada saat inisialisasi aplikasi sebelum komponen apapun dirender.
3. THE Sistem SHALL menyediakan file `.env.example` yang memuat seluruh environment variable yang diperlukan beserta komentar penjelasan, tanpa menyertakan nilai rahasia.
4. THE Supabase_Client SHALL diinisialisasi sebagai singleton di `src/lib/supabase.ts` dan diimpor oleh seluruh Service_Layer, sehingga tidak ada inisialisasi duplikat di komponen React.
5. WHERE aplikasi berjalan di mode development, THE Sistem SHALL memuat Supabase_Client tanpa MSW sehingga seluruh request diteruskan langsung ke Supabase.
6. THE Sistem SHALL menyertakan file `supabase/config.toml` yang mendefinisikan konfigurasi project Supabase lokal untuk keperluan pengembangan dengan Supabase CLI.

---

### Requirement 2: Skema Database PostgreSQL

**User Story:** Sebagai Developer, saya ingin skema database yang terdefinisi dengan baik di Supabase, sehingga seluruh data aplikasi tersimpan secara konsisten dan query dapat berjalan dengan performa yang memadai.

#### Acceptance Criteria

1. THE Sistem SHALL mendefinisikan tabel `employees` dengan kolom: `id` (UUID, primary key), `nik` (text, unique, not null), `full_name` (text, not null), `department` (text, not null), `position` (text, not null), `status` (text, default `active`), `qr_token` (text, unique, not null), `qr_version` (integer, default 1), `created_at` (timestamptz), `updated_at` (timestamptz).
2. THE Sistem SHALL mendefinisikan tabel `attendance_records` dengan kolom: `id` (UUID, primary key), `employee_id` (UUID, foreign key ke `employees.id`), `date` (date, not null), `check_in_time` (timestamptz), `check_out_time` (timestamptz), `work_duration_minutes` (integer), `status` (text, not null), `session_id` (UUID, foreign key ke `attendance_sessions.id`), `is_manual_correction` (boolean, default false), `leave_id` (UUID, foreign key ke `leave_records.id`), `created_at` (timestamptz), `updated_at` (timestamptz).
3. THE Sistem SHALL mendefinisikan tabel `attendance_sessions` dengan kolom: `id` (UUID, primary key), `name` (text, not null), `type` (text, not null — nilai: `check-in` atau `check-out`), `start_time` (time, not null), `end_time` (time, not null), `late_tolerance_minutes` (integer, default 0), `is_active` (boolean, default true), `created_at` (timestamptz).
4. THE Sistem SHALL mendefinisikan tabel `holidays` dengan kolom: `id` (UUID, primary key), `date` (date, unique, not null), `name` (text, not null), `type` (text, not null — nilai: `national` atau `company`).
5. THE Sistem SHALL mendefinisikan tabel `workday_config` dengan kolom: `id` (UUID, primary key), `work_days` (integer[], not null — nilai 0–6 mewakili hari Minggu–Sabtu), `updated_at` (timestamptz).
6. THE Sistem SHALL mendefinisikan tabel `leave_records` dengan kolom: `id` (UUID, primary key), `employee_id` (UUID, foreign key ke `employees.id`), `date` (date, not null), `reason` (text, not null), `submitted_by` (UUID, foreign key ke `auth.users.id`), `submitted_at` (timestamptz).
7. THE Sistem SHALL mendefinisikan tabel `correction_records` dengan kolom: `id` (UUID, primary key), `attendance_record_id` (UUID, foreign key ke `attendance_records.id`), `employee_id` (UUID, foreign key ke `employees.id`), `date` (date, not null), `original_check_in` (timestamptz), `original_check_out` (timestamptz), `corrected_check_in` (timestamptz), `corrected_check_out` (timestamptz), `reason` (text, not null), `corrected_by` (UUID, foreign key ke `auth.users.id`), `corrected_at` (timestamptz).
8. THE Sistem SHALL membuat index pada kolom-kolom berikut untuk mengoptimalkan query yang sering dijalankan: `attendance_records(employee_id)`, `attendance_records(date)`, `attendance_records(employee_id, date)` (composite), `employees(nik)`, `employees(department)`, `employees(status)`, `leave_records(employee_id, date)`.
9. THE Sistem SHALL mendefinisikan constraint `UNIQUE(employee_id, date)` pada tabel `attendance_records` untuk mencegah duplikasi catatan kehadiran per karyawan per hari.
10. THE Sistem SHALL mendefinisikan seluruh skema database dalam Migration_File SQL bernomor urut di direktori `supabase/migrations/` sehingga perubahan skema dapat direproduksi dan di-rollback.
11. FOR ALL Migration_File yang dijalankan secara berurutan dari awal, THE Sistem SHALL menghasilkan skema database yang identik dengan skema yang dihasilkan oleh menjalankan seluruh migration sekaligus (properti idempoten migrasi).

---

### Requirement 3: Autentikasi dengan Supabase Auth

**User Story:** Sebagai pengguna, saya ingin login menggunakan kredensial yang sudah ada, sehingga saya dapat mengakses fitur sesuai peran saya tanpa perlu mendaftar ulang.

#### Acceptance Criteria

1. WHEN pengguna memasukkan username dan password yang valid, THE Supabase_Auth SHALL mengautentikasi pengguna menggunakan email (format `{username}@hr-app.internal`) dan password, lalu mengembalikan JWT yang valid.
2. WHEN autentikasi berhasil, THE Sistem SHALL membaca peran pengguna (`admin` atau `employee`) dari field `user_metadata.role` pada JWT yang diterbitkan Supabase_Auth.
3. WHEN autentikasi berhasil untuk pengguna dengan peran `employee`, THE Sistem SHALL membaca `user_metadata.employee_id` dari JWT untuk mengidentifikasi data karyawan yang terkait.
4. THE Supabase_Auth SHALL mengelola refresh token secara otomatis sehingga sesi pengguna tetap aktif tanpa perlu login ulang selama token refresh masih valid.
5. WHEN pengguna melakukan logout, THE Supabase_Auth SHALL mencabut sesi aktif dan menghapus token dari penyimpanan lokal browser.
6. IF pengguna memasukkan kombinasi username dan password yang salah sebanyak 5 kali berturut-turut, THEN THE Sistem SHALL mengunci akun tersebut selama 15 menit dan menampilkan pesan yang menyebutkan durasi penguncian.
7. WHEN sesi pengguna tidak aktif selama 30 menit, THE Supabase_Auth SHALL mengakhiri sesi secara otomatis dan THE Sistem SHALL mengarahkan pengguna ke halaman login.
8. THE Sistem SHALL menyediakan fungsi `createUser` yang hanya dapat dipanggil oleh Admin untuk membuat akun Supabase_Auth baru bagi karyawan, dengan menetapkan `user_metadata.role` dan `user_metadata.employee_id` pada saat pembuatan akun.
9. FOR ALL sesi yang aktif, THE Sistem SHALL memastikan bahwa peran yang tersimpan di JWT konsisten dengan peran yang ditampilkan di antarmuka pengguna (properti konsistensi peran).

---

### Requirement 4: Row Level Security (RLS)

**User Story:** Sebagai Admin, saya ingin data karyawan terlindungi di level database, sehingga karyawan tidak dapat mengakses atau memodifikasi data milik karyawan lain meskipun mereka mengetahui ID-nya.

#### Acceptance Criteria

1. THE Sistem SHALL mengaktifkan RLS pada seluruh tabel: `employees`, `attendance_records`, `attendance_sessions`, `holidays`, `workday_config`, `leave_records`, dan `correction_records`.
2. WHILE pengguna dengan peran `admin` sedang terautentikasi, THE Sistem SHALL mengizinkan operasi SELECT, INSERT, UPDATE, dan DELETE pada seluruh baris di semua tabel.
3. WHILE pengguna dengan peran `employee` sedang terautentikasi, THE Sistem SHALL mengizinkan operasi SELECT hanya pada baris `attendance_records` yang memiliki `employee_id` sama dengan `user_metadata.employee_id` milik pengguna tersebut.
4. WHILE pengguna dengan peran `employee` sedang terautentikasi, THE Sistem SHALL mengizinkan operasi SELECT hanya pada baris `employees` yang memiliki `id` sama dengan `user_metadata.employee_id` milik pengguna tersebut.
5. WHILE pengguna dengan peran `employee` sedang terautentikasi, THE Sistem SHALL mengizinkan operasi SELECT pada tabel `attendance_sessions`, `holidays`, dan `workday_config` tanpa pembatasan baris karena data ini bersifat publik bagi seluruh karyawan.
6. IF request ke database datang tanpa JWT yang valid, THEN THE Sistem SHALL menolak seluruh operasi pada tabel yang dilindungi RLS dan mengembalikan error autentikasi.
7. THE Sistem SHALL mendefinisikan seluruh policy RLS dalam Migration_File yang sama dengan definisi tabel terkait sehingga RLS selalu aktif sejak tabel dibuat.
8. WHILE pengguna dengan peran `employee` sedang terautentikasi, THE Sistem SHALL mencegah operasi INSERT, UPDATE, dan DELETE pada seluruh tabel kecuali operasi yang secara eksplisit diizinkan melalui Edge_Function.

---

### Requirement 5: Migrasi Service Layer FE dari MSW ke Supabase

**User Story:** Sebagai Developer, saya ingin mengganti MSW dengan Supabase_Client di Service_Layer tanpa mengubah antarmuka fungsi yang sudah ada, sehingga komponen React dan Zustand store tidak perlu dimodifikasi.

#### Acceptance Criteria

1. THE Service_Layer SHALL mempertahankan seluruh signature fungsi yang sudah ada (nama fungsi, parameter, dan tipe return) sehingga tidak ada perubahan pada file komponen React atau Zustand store.
2. WHEN `authService.login()` dipanggil dengan kredensial valid, THE Service_Layer SHALL memanggil `supabase.auth.signInWithPassword()` dan mengembalikan objek `AuthUser` dengan format yang identik dengan format yang sebelumnya dikembalikan oleh MSW.
3. WHEN `employeeService.getEmployees()` dipanggil, THE Service_Layer SHALL menjalankan query Supabase ke tabel `employees` dan mengembalikan array `Employee[]` dengan field yang di-mapping dari snake_case (database) ke camelCase (TypeScript).
4. THE Service_Layer SHALL mengimplementasikan fungsi mapping terpusat yang mengonversi respons Supabase (snake_case) ke tipe TypeScript yang sudah ada (camelCase) untuk setiap entitas: `Employee`, `AttendanceRecord`, `AttendanceSession`, `Holiday`, `LeaveRecord`, dan `CorrectionRecord`.
5. IF Supabase_Client mengembalikan error pada operasi apapun, THEN THE Service_Layer SHALL menangkap error tersebut dan melempar ulang sebagai `ApiError` dengan format `{ message: string, code?: string }` yang konsisten di seluruh Service_Layer.
6. THE Sistem SHALL menghapus seluruh file MSW (`src/mocks/`) setelah seluruh Service_Layer berhasil dimigrasikan dan diverifikasi berfungsi dengan Supabase.
7. FOR ALL fungsi di Service_Layer, THE Sistem SHALL memastikan bahwa memanggil fungsi yang sama dua kali dengan parameter yang sama menghasilkan data yang konsisten dari database (properti determinisme query).

---

### Requirement 6: Real-time Updates dengan Supabase Realtime

**User Story:** Sebagai Admin yang membuka halaman rekap kehadiran, saya ingin data kehadiran diperbarui secara otomatis ketika ada scan QR baru, sehingga saya tidak perlu me-refresh halaman secara manual.

#### Acceptance Criteria

1. WHEN Admin membuka halaman rekap kehadiran, THE Sistem SHALL berlangganan Realtime_Channel pada tabel `attendance_records` untuk menerima notifikasi INSERT dan UPDATE secara real-time.
2. WHEN ada catatan kehadiran baru yang di-INSERT ke tabel `attendance_records`, THE Sistem SHALL memperbarui tampilan rekap kehadiran dalam waktu kurang dari 2 detik tanpa reload halaman.
3. WHEN Admin menutup halaman rekap kehadiran atau berpindah ke halaman lain, THE Sistem SHALL membatalkan langganan Realtime_Channel untuk mencegah memory leak.
4. IF koneksi Realtime_Channel terputus, THEN THE Sistem SHALL mencoba menyambung ulang secara otomatis dan menampilkan indikator status koneksi kepada pengguna.
5. WHILE Karyawan membuka halaman riwayat kehadiran pribadi, THE Sistem SHALL berlangganan Realtime_Channel yang difilter hanya untuk `employee_id` milik karyawan tersebut, sehingga karyawan tidak menerima update data karyawan lain.

---

### Requirement 7: Edge Function — Proses Scan QR

**User Story:** Sebagai sistem, saya ingin validasi QR code diproses di server, sehingga logika penentuan status kehadiran tidak dapat dimanipulasi dari sisi klien.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan Edge_Function `process-qr-scan` yang menerima `{ token: string }` dan mengembalikan objek `ScanResult` dengan field: `success`, `type`, `employeeName`, `timestamp`, `status`, dan `message`.
2. WHEN `process-qr-scan` dipanggil dengan token yang valid, THE Edge_Function SHALL: (a) mendekode token untuk mendapatkan `employeeId`, (b) memverifikasi karyawan aktif, (c) menentukan sesi absensi yang sedang berlangsung, (d) memeriksa duplikasi scan pada sesi yang sama, (e) menghitung status kehadiran (`present` atau `late`), dan (f) menyimpan catatan ke tabel `attendance_records` dalam satu transaksi database.
3. IF token yang diterima `process-qr-scan` tidak dapat didekode atau tidak cocok dengan karyawan manapun, THEN THE Edge_Function SHALL mengembalikan `{ success: false, type: "invalid", message: "Token QR tidak valid" }` tanpa menyimpan data apapun.
4. IF karyawan yang teridentifikasi dari token memiliki status `inactive`, THEN THE Edge_Function SHALL mengembalikan `{ success: false, type: "inactive", message: "Karyawan tidak aktif" }`.
5. IF karyawan sudah memiliki catatan absensi masuk pada sesi yang sama di hari yang sama, THEN THE Edge_Function SHALL mengembalikan `{ success: false, type: "duplicate", message: "Absensi sudah tercatat" }` tanpa menyimpan data duplikat.
6. WHEN `process-qr-scan` berhasil menyimpan catatan absensi, THE Edge_Function SHALL mengembalikan respons dalam waktu kurang dari 3 detik.
7. THE Edge_Function `process-qr-scan` SHALL dapat dipanggil tanpa autentikasi pengguna (menggunakan service role key di server) karena scanner QR beroperasi sebagai perangkat publik.

---

### Requirement 8: Edge Function — Generate dan Regenerasi QR Token

**User Story:** Sebagai Admin, saya ingin QR token dibuat dan diperbarui di server, sehingga token tidak dapat diprediksi atau dipalsukan oleh pihak yang tidak berwenang.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan Edge_Function `generate-qr-token` yang menerima `{ employeeId: string }` dan mengembalikan `{ token: string, qrDataUrl: string, generatedAt: string }`.
2. WHEN `generate-qr-token` dipanggil untuk karyawan yang ada, THE Edge_Function SHALL menghasilkan token baru menggunakan kombinasi `employeeId`, `nik`, timestamp saat ini, dan nomor versi yang dienkripsi dengan HMAC-SHA256 menggunakan secret key yang disimpan sebagai environment variable Supabase.
3. WHEN `generate-qr-token` dipanggil untuk regenerasi, THE Edge_Function SHALL menginkrementasi `qr_version` di tabel `employees` dan menyimpan token baru, sehingga token lama otomatis tidak valid karena versi tidak cocok.
4. IF `generate-qr-token` dipanggil oleh pengguna dengan peran selain `admin`, THEN THE Edge_Function SHALL mengembalikan HTTP 403 Forbidden.
5. FOR ALL token yang dihasilkan oleh `generate-qr-token`, THE Edge_Function SHALL memastikan bahwa mendekode token menghasilkan kembali `employeeId` dan `nik` yang sama (properti round-trip: encode → decode → identitas karyawan).

---

### Requirement 9: Edge Function — Export Excel

**User Story:** Sebagai Admin, saya ingin file Excel dihasilkan di server, sehingga proses export tidak membebani browser dan file yang dihasilkan konsisten untuk semua pengguna.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan Edge_Function `export-attendance` yang menerima `{ startDate: string, endDate: string, department?: string }` dan mengembalikan file binary Excel (.xlsx) dengan header `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
2. WHEN `export-attendance` dipanggil, THE Edge_Function SHALL mengambil data dari tabel `attendance_records` yang di-join dengan `employees`, memfilter sesuai parameter, dan menghasilkan file Excel dengan kolom: NIK, Nama Karyawan, Departemen, Tanggal, Waktu Masuk, Waktu Keluar, Durasi Kerja, dan Status Kehadiran.
3. THE Edge_Function `export-attendance` SHALL menghasilkan file Excel dengan nama yang mengikuti format `Rekap_Kehadiran_[Departemen]_[TanggalMulai]_[TanggalSelesai].xlsx` yang dikirimkan melalui header `Content-Disposition`.
4. WHEN `export-attendance` dipanggil untuk rentang tanggal yang tidak memiliki data, THE Edge_Function SHALL menghasilkan file Excel yang memuat baris header tanpa baris data.
5. IF `export-attendance` dipanggil oleh pengguna dengan peran selain `admin`, THEN THE Edge_Function SHALL mengembalikan HTTP 403 Forbidden.
6. THE Edge_Function `export-attendance` SHALL menghasilkan file Excel untuk data hingga 10.000 baris dalam waktu kurang dari 10 detik.
7. FOR ALL data yang diekspor, THE Edge_Function SHALL memastikan bahwa jumlah baris dalam file Excel sama dengan jumlah catatan yang dikembalikan oleh query dengan filter yang sama (properti konsistensi data ekspor).

---

### Requirement 10: Edge Function — Auto-Set Status Tidak Hadir

**User Story:** Sebagai sistem, saya ingin status "Tidak Hadir" ditetapkan secara otomatis di akhir hari kerja, sehingga Admin tidak perlu memeriksa dan memperbarui status secara manual setiap hari.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan Edge_Function `mark-absent` yang dapat dipanggil melalui Supabase Cron Job setiap hari kerja pada pukul 23:59 WIB.
2. WHEN `mark-absent` dijalankan, THE Edge_Function SHALL mengidentifikasi seluruh karyawan aktif yang tidak memiliki catatan `attendance_records` untuk hari tersebut dan hari tersebut bukan hari libur yang terdaftar di tabel `holidays`.
3. WHEN `mark-absent` mengidentifikasi karyawan tanpa catatan kehadiran, THE Edge_Function SHALL menyisipkan baris baru ke tabel `attendance_records` dengan `status = 'absent'`, `check_in_time = NULL`, `check_out_time = NULL`, dan `date` = tanggal hari tersebut.
4. IF hari saat `mark-absent` dijalankan adalah hari libur atau bukan hari kerja sesuai konfigurasi `workday_config`, THEN THE Edge_Function SHALL tidak menyisipkan catatan apapun dan mengembalikan respons yang menyatakan hari tersebut bukan hari kerja.
5. WHEN `mark-absent` selesai dijalankan, THE Edge_Function SHALL mengembalikan ringkasan yang mencakup: jumlah karyawan yang ditandai tidak hadir dan daftar `employee_id` yang diproses.
6. THE Edge_Function `mark-absent` SHALL hanya dapat dipanggil menggunakan service role key Supabase, bukan anon key, untuk mencegah eksekusi tidak sah dari sisi klien.

---

### Requirement 11: Supabase Storage untuk Foto Profil

**User Story:** Sebagai Admin, saya ingin dapat mengunggah foto profil karyawan, sehingga tampilan daftar karyawan lebih informatif dan mudah dikenali.

#### Acceptance Criteria

1. WHERE fitur foto profil diaktifkan, THE Sistem SHALL membuat bucket `employee-avatars` di Supabase Storage dengan akses publik untuk operasi baca (GET) sehingga foto dapat ditampilkan tanpa autentikasi.
2. WHERE fitur foto profil diaktifkan, THE Sistem SHALL membatasi operasi unggah (PUT/POST) ke bucket `employee-avatars` hanya untuk pengguna dengan peran `admin`.
3. WHERE fitur foto profil diaktifkan, THE Sistem SHALL menerima file gambar dengan format JPEG atau PNG dengan ukuran maksimal 2 MB per file.
4. WHERE fitur foto profil diaktifkan, THE Sistem SHALL menyimpan foto dengan nama file `{employee_id}.{ext}` sehingga setiap karyawan hanya memiliki satu foto aktif dan unggah ulang otomatis menimpa foto lama.
5. WHERE fitur foto profil diaktifkan, THE Sistem SHALL menambahkan kolom `avatar_url` (text, nullable) pada tabel `employees` yang menyimpan URL publik foto dari Supabase Storage.

---

### Requirement 12: Seed Data untuk Development dan Demo

**User Story:** Sebagai Developer, saya ingin database terisi data awal yang realistis secara otomatis, sehingga saya dapat langsung menguji seluruh fitur tanpa perlu memasukkan data secara manual.

#### Acceptance Criteria

1. THE Sistem SHALL menyediakan file SQL `supabase/seed.sql` yang dapat dijalankan sekali untuk mengisi database dengan data awal pengembangan.
2. WHEN `seed.sql` dijalankan, THE Sistem SHALL menyisipkan minimal 10 karyawan aktif dari minimal 3 departemen berbeda ke tabel `employees`, masing-masing dengan `qr_token` yang unik.
3. WHEN `seed.sql` dijalankan, THE Sistem SHALL menyisipkan catatan `attendance_records` untuk 30 hari kalender terakhir untuk seluruh karyawan seed, dengan distribusi status yang realistis: sekitar 80% hadir, 10% terlambat, 5% tidak hadir, dan 5% izin.
4. WHEN `seed.sql` dijalankan, THE Sistem SHALL menyisipkan minimal 2 `attendance_sessions` (satu untuk check-in pagi dan satu untuk check-out sore), minimal 5 `holidays` untuk tahun berjalan, dan 1 `workday_config` dengan hari kerja Senin–Jumat.
5. WHEN `seed.sql` dijalankan, THE Sistem SHALL membuat akun Supabase_Auth untuk setiap karyawan seed dengan format email `{nik}@hr-app.internal` dan password default `Password123!`, serta menetapkan `user_metadata.role = 'employee'` dan `user_metadata.employee_id` yang sesuai.
6. WHEN `seed.sql` dijalankan, THE Sistem SHALL membuat minimal 1 akun Admin dengan email `admin@hr-app.internal`, password `Admin123!`, dan `user_metadata.role = 'admin'`.
7. IF `seed.sql` dijalankan lebih dari satu kali, THEN THE Sistem SHALL menggunakan `INSERT ... ON CONFLICT DO NOTHING` atau mekanisme idempoten serupa sehingga tidak terjadi error duplikasi data.
8. FOR ALL data seed yang disisipkan, THE Sistem SHALL memastikan bahwa seluruh foreign key constraint terpenuhi dan tidak ada baris orphan (properti integritas referensial seed data).
