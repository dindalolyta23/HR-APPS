# Dokumen Persyaratan

## Pendahuluan

Sistem Absensi Portofolio adalah aplikasi web front end yang dirancang untuk menampilkan kemampuan teknis seorang Front End Engineer. Aplikasi ini mensimulasikan sistem absensi karyawan modern dengan fitur clock-in/clock-out, riwayat kehadiran, dashboard statistik, dan manajemen profil. Proyek ini mendemonstrasikan penguasaan React, state management, integrasi API (mock/REST), desain UI/UX responsif, aksesibilitas, dan best practices pengembangan front end modern.

## Glosarium

- **Attendance_App**: Aplikasi web sistem absensi portofolio secara keseluruhan
- **Auth_Module**: Modul yang menangani autentikasi dan otorisasi pengguna
- **Clock_Widget**: Komponen UI utama untuk melakukan clock-in dan clock-out
- **Dashboard**: Halaman utama yang menampilkan ringkasan statistik kehadiran
- **Attendance_Record**: Satu entri data kehadiran yang berisi waktu masuk, waktu keluar, dan durasi kerja
- **History_View**: Tampilan daftar riwayat kehadiran dengan filter dan pagination
- **Profile_Module**: Modul pengelolaan data profil pengguna
- **State_Manager**: Lapisan manajemen state global aplikasi (misalnya Redux Toolkit / Zustand)
- **API_Client**: Lapisan abstraksi untuk komunikasi dengan backend atau mock API
- **Mock_API**: Simulasi backend menggunakan MSW (Mock Service Worker) atau JSON Server
- **Theme_Engine**: Sistem pengelolaan tema terang/gelap aplikasi
- **Validator**: Modul validasi input dan data form
- **Notification_System**: Sistem notifikasi toast/snackbar untuk umpan balik pengguna
- **Router**: Modul routing sisi klien (React Router)
- **Session**: Data sesi pengguna yang sedang login, tersimpan di memori atau localStorage

---

## Persyaratan

### Persyaratan 1: Autentikasi Pengguna

**User Story:** Sebagai calon karyawan yang mengevaluasi portofolio, saya ingin melihat alur login yang realistis, sehingga saya dapat menilai kemampuan implementasi autentikasi front end.

#### Kriteria Penerimaan

1. THE `Auth_Module` SHALL menyediakan halaman login dengan form yang memiliki field email dan password.
2. WHEN pengguna mengisi email dan password yang valid lalu menekan tombol "Masuk", THE `Auth_Module` SHALL mengirim permintaan autentikasi ke `API_Client` dan menyimpan `Session` yang berhasil.
3. WHEN permintaan autentikasi berhasil, THE `Router` SHALL mengarahkan pengguna ke halaman `Dashboard`.
4. IF `API_Client` mengembalikan respons error autentikasi, THEN THE `Auth_Module` SHALL menampilkan pesan error yang deskriptif di bawah form tanpa me-refresh halaman.
5. WHEN pengguna mengakses rute yang dilindungi tanpa `Session` yang valid, THE `Router` SHALL mengarahkan pengguna ke halaman login.
6. THE `Validator` SHALL memvalidasi format email sebelum permintaan dikirim dan menampilkan pesan validasi inline jika format tidak valid.
7. WHEN pengguna menekan tombol "Keluar", THE `Auth_Module` SHALL menghapus `Session` dan mengarahkan pengguna ke halaman login.
8. WHERE fitur "Ingat Saya" diaktifkan, THE `Auth_Module` SHALL menyimpan token sesi di localStorage sehingga sesi tetap aktif setelah browser ditutup.

---

### Persyaratan 2: Clock-In dan Clock-Out

**User Story:** Sebagai pengguna yang sudah login, saya ingin melakukan clock-in dan clock-out dengan mudah, sehingga saya dapat mencatat waktu kerja saya secara akurat.

#### Kriteria Penerimaan

1. THE `Clock_Widget` SHALL menampilkan waktu saat ini secara real-time dengan pembaruan setiap detik.
2. WHEN pengguna belum melakukan clock-in pada hari ini, THE `Clock_Widget` SHALL menampilkan tombol "Clock In" yang aktif dan tombol "Clock Out" yang dinonaktifkan.
3. WHEN pengguna menekan tombol "Clock In", THE `Clock_Widget` SHALL merekam timestamp clock-in, mengirimnya ke `API_Client`, dan memperbarui tampilan ke status "Sedang Bekerja".
4. WHILE pengguna dalam status "Sedang Bekerja", THE `Clock_Widget` SHALL menampilkan durasi kerja berjalan yang diperbarui setiap detik.
5. WHEN pengguna menekan tombol "Clock Out", THE `Clock_Widget` SHALL merekam timestamp clock-out, mengirimnya ke `API_Client`, dan menyimpan `Attendance_Record` yang lengkap.
6. IF `API_Client` gagal menyimpan data clock-in atau clock-out, THEN THE `Clock_Widget` SHALL menampilkan notifikasi error melalui `Notification_System` dan mempertahankan state sebelumnya.
7. WHEN clock-out berhasil, THE `Notification_System` SHALL menampilkan ringkasan durasi kerja hari ini kepada pengguna.
8. THE `Clock_Widget` SHALL mencegah pengguna melakukan clock-in lebih dari satu kali dalam satu hari kalender.

---

### Persyaratan 3: Dashboard Statistik Kehadiran

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan statistik kehadiran saya, sehingga saya dapat memantau pola kerja dan produktivitas saya.

#### Kriteria Penerimaan

1. THE `Dashboard` SHALL menampilkan kartu statistik yang berisi: total hari hadir bulan ini, total jam kerja bulan ini, rata-rata jam kerja per hari, dan jumlah keterlambatan bulan ini.
2. WHEN `Dashboard` pertama kali dimuat, THE `API_Client` SHALL mengambil data statistik kehadiran bulan berjalan dan `State_Manager` SHALL menyimpan hasilnya.
3. THE `Dashboard` SHALL menampilkan grafik kehadiran mingguan yang memvisualisasikan jam kerja per hari dalam 7 hari terakhir.
4. WHILE data statistik sedang dimuat dari `API_Client`, THE `Dashboard` SHALL menampilkan skeleton loading pada setiap kartu statistik dan grafik.
5. IF `API_Client` gagal mengambil data statistik, THEN THE `Dashboard` SHALL menampilkan pesan error dengan tombol "Coba Lagi" yang memungkinkan pengguna memuat ulang data.
6. THE `Dashboard` SHALL menampilkan status kehadiran hari ini (Hadir / Belum Hadir / Sedang Bekerja) dengan indikator warna yang jelas.
7. WHEN pengguna berhasil melakukan clock-in atau clock-out, THE `Dashboard` SHALL memperbarui statistik yang relevan secara otomatis tanpa memuat ulang halaman.

---

### Persyaratan 4: Riwayat Kehadiran

**User Story:** Sebagai pengguna, saya ingin melihat dan memfilter riwayat kehadiran saya, sehingga saya dapat meninjau catatan kerja saya di masa lalu.

#### Kriteria Penerimaan

1. THE `History_View` SHALL menampilkan daftar `Attendance_Record` yang diurutkan dari tanggal terbaru ke terlama.
2. THE `History_View` SHALL menampilkan setiap `Attendance_Record` dengan informasi: tanggal, waktu clock-in, waktu clock-out, total durasi kerja, dan status (Tepat Waktu / Terlambat / Lembur).
3. WHEN pengguna memilih rentang tanggal pada filter, THE `History_View` SHALL memfilter dan menampilkan hanya `Attendance_Record` dalam rentang tanggal tersebut.
4. WHEN pengguna memilih filter status (Semua / Tepat Waktu / Terlambat / Lembur), THE `History_View` SHALL memfilter daftar sesuai status yang dipilih.
5. THE `History_View` SHALL menampilkan data dalam halaman-halaman dengan maksimal 10 `Attendance_Record` per halaman dan menyediakan kontrol navigasi halaman.
6. WHILE data riwayat sedang dimuat, THE `History_View` SHALL menampilkan skeleton loading sebanyak 5 baris.
7. IF tidak ada `Attendance_Record` yang cocok dengan filter yang diterapkan, THEN THE `History_View` SHALL menampilkan ilustrasi dan pesan "Tidak ada data kehadiran ditemukan".
8. THE `History_View` SHALL menyediakan tombol ekspor yang mengunduh data riwayat yang sedang ditampilkan dalam format CSV.

---

### Persyaratan 5: Manajemen Profil Pengguna

**User Story:** Sebagai pengguna, saya ingin mengelola informasi profil saya, sehingga data akun saya selalu akurat dan terkini.

#### Kriteria Penerimaan

1. THE `Profile_Module` SHALL menampilkan form yang berisi field: nama lengkap, jabatan, departemen, email, dan nomor telepon.
2. WHEN pengguna mengubah data pada form profil dan menekan tombol "Simpan", THE `Validator` SHALL memvalidasi semua field sebelum `API_Client` mengirim permintaan pembaruan.
3. IF `Validator` menemukan field yang tidak valid, THEN THE `Profile_Module` SHALL menampilkan pesan validasi inline pada setiap field yang bermasalah tanpa mengirim permintaan ke `API_Client`.
4. WHEN `API_Client` berhasil memperbarui profil, THE `Notification_System` SHALL menampilkan notifikasi sukses dan `State_Manager` SHALL memperbarui data `Session` yang tersimpan.
5. THE `Profile_Module` SHALL memungkinkan pengguna mengunggah foto profil dengan validasi tipe file (JPG, PNG, WebP) dan ukuran maksimal 2MB.
6. IF file foto yang diunggah melebihi 2MB atau bukan tipe yang didukung, THEN THE `Profile_Module` SHALL menampilkan pesan error yang spesifik sebelum proses unggah dimulai.
7. THE `Profile_Module` SHALL menampilkan preview foto profil baru secara langsung setelah pengguna memilih file, sebelum disimpan.

---

### Persyaratan 6: Tema dan Aksesibilitas

**User Story:** Sebagai pengguna, saya ingin dapat menggunakan aplikasi dalam mode terang atau gelap dan dengan teknologi bantu, sehingga pengalaman penggunaan saya nyaman dan inklusif.

#### Kriteria Penerimaan

1. THE `Theme_Engine` SHALL menyediakan toggle untuk beralih antara tema terang dan tema gelap.
2. WHEN pengguna mengaktifkan tema gelap, THE `Theme_Engine` SHALL menerapkan tema gelap ke seluruh komponen aplikasi secara konsisten.
3. WHEN `Attendance_App` pertama kali dimuat, THE `Theme_Engine` SHALL membaca preferensi tema dari `prefers-color-scheme` media query sistem operasi pengguna sebagai nilai default.
4. WHEN pengguna mengubah preferensi tema melalui toggle, THE `Theme_Engine` SHALL menyimpan preferensi tersebut di localStorage sehingga preferensi dipertahankan saat halaman dimuat ulang.
5. THE `Attendance_App` SHALL memastikan semua elemen interaktif memiliki atribut ARIA yang sesuai sehingga dapat dioperasikan dengan screen reader.
6. THE `Attendance_App` SHALL memastikan semua teks dan elemen UI memenuhi rasio kontras warna minimum 4.5:1 sesuai standar WCAG 2.1 Level AA pada kedua tema.
7. THE `Attendance_App` SHALL memastikan seluruh alur utama (login, clock-in, clock-out, melihat riwayat) dapat diselesaikan hanya menggunakan keyboard tanpa mouse.

---

### Persyaratan 7: Responsivitas dan Performa

**User Story:** Sebagai pengguna yang mengakses dari berbagai perangkat, saya ingin aplikasi berfungsi dengan baik di desktop maupun mobile, sehingga saya dapat menggunakannya kapan saja dan di mana saja.

#### Kriteria Penerimaan

1. THE `Attendance_App` SHALL menampilkan layout yang responsif dan dapat digunakan pada lebar layar mulai dari 320px hingga 2560px.
2. WHEN `Attendance_App` diakses pada perangkat dengan lebar layar kurang dari 768px, THE `Router` SHALL menampilkan navigasi dalam bentuk bottom navigation bar sebagai pengganti sidebar.
3. THE `Attendance_App` SHALL mencapai skor Lighthouse Performance minimal 85 pada kondisi jaringan simulasi 4G.
4. WHEN `Attendance_App` pertama kali dimuat, THE `Router` SHALL menerapkan code splitting berbasis rute sehingga setiap halaman hanya memuat bundle JavaScript yang diperlukan.
5. THE `API_Client` SHALL menerapkan strategi caching untuk respons API yang tidak sering berubah, dengan durasi cache maksimal 5 menit, untuk mengurangi permintaan jaringan yang berulang.
6. IF koneksi jaringan pengguna terputus, THEN THE `Attendance_App` SHALL menampilkan banner notifikasi offline dan menonaktifkan aksi yang memerlukan koneksi jaringan.

---

### Persyaratan 8: Demonstrasi Kualitas Kode (Portofolio)

**User Story:** Sebagai rekruter atau engineer yang meninjau portofolio, saya ingin melihat bukti praktik pengembangan yang baik, sehingga saya dapat menilai standar kualitas kode kandidat.

#### Kriteria Penerimaan

1. THE `Attendance_App` SHALL diimplementasikan menggunakan TypeScript dengan strict mode diaktifkan, tanpa penggunaan tipe `any` yang eksplisit.
2. THE `Attendance_App` SHALL menyertakan unit test untuk semua komponen utama dan fungsi utilitas dengan cakupan kode (code coverage) minimal 70%.
3. THE `Attendance_App` SHALL menyertakan file README.md yang mendokumentasikan: cara menjalankan proyek, arsitektur aplikasi, keputusan teknis utama, dan daftar fitur yang diimplementasikan.
4. THE `Attendance_App` SHALL menggunakan ESLint dan Prettier dengan konfigurasi yang konsisten di seluruh codebase.
5. THE `Mock_API` SHALL mensimulasikan latensi jaringan realistis antara 200ms hingga 800ms untuk setiap respons, sehingga loading state dapat didemonstrasikan secara nyata.
6. THE `Attendance_App` SHALL di-deploy ke platform hosting publik (misalnya Vercel atau Netlify) sehingga dapat diakses secara langsung tanpa instalasi lokal.
