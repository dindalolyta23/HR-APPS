# Dokumen Requirements

## Pendahuluan

HR Mini App adalah aplikasi manajemen kehadiran karyawan berbasis QR code yang dirancang untuk perusahaan dengan tim IT seperti Praisindo. Aplikasi ini memungkinkan karyawan melakukan absensi secara mandiri menggunakan QR code, sementara admin HR dan manajer dapat memantau rekap kehadiran secara real-time serta mengekspor laporan ke format Excel untuk keperluan penggajian dan audit.

Fokus utama aplikasi adalah kemudahan penggunaan, akurasi data kehadiran, dan kemampuan pelaporan yang fleksibel.

---

## Glosarium

- **Sistem**: HR Mini App secara keseluruhan
- **Karyawan**: Pengguna akhir yang melakukan absensi harian
- **Admin**: Staf HR atau administrator yang mengelola data karyawan dan laporan kehadiran
- **QR_Code**: Kode matriks dua dimensi yang unik per karyawan, digunakan sebagai identitas absensi
- **QR_Scanner**: Komponen aplikasi yang membaca dan memvalidasi QR code
- **Sesi_Absensi**: Periode waktu yang ditentukan Admin untuk absensi masuk atau keluar (misalnya: 07:00–09:00 untuk masuk)
- **Rekap_Kehadiran**: Ringkasan data kehadiran karyawan dalam rentang waktu tertentu
- **Export_Engine**: Komponen yang mengonversi data kehadiran ke format file Excel (.xlsx)
- **Status_Kehadiran**: Klasifikasi kehadiran karyawan: Hadir, Terlambat, Tidak Hadir, atau Izin
- **Token_QR**: String unik terenkripsi yang tertanam dalam QR code setiap karyawan
- **Laporan**: File Excel yang dihasilkan dari data rekap kehadiran

---

## Requirements

### Requirement 1: Manajemen Data Karyawan

**User Story:** Sebagai Admin, saya ingin mengelola data karyawan di dalam sistem, sehingga setiap karyawan memiliki identitas yang valid untuk keperluan absensi.

#### Acceptance Criteria

1. THE Sistem SHALL menyimpan data karyawan yang mencakup minimal: nama lengkap, nomor induk karyawan (NIK), departemen, jabatan, dan status aktif.
2. WHEN Admin menambahkan karyawan baru dengan data yang lengkap dan valid, THE Sistem SHALL menyimpan data karyawan dan menghasilkan Token_QR yang unik untuk karyawan tersebut.
3. IF Admin menambahkan karyawan dengan NIK yang sudah terdaftar, THEN THE Sistem SHALL menolak penyimpanan dan menampilkan pesan kesalahan yang menyebutkan NIK yang duplikat.
4. WHEN Admin menonaktifkan karyawan, THE Sistem SHALL mengubah status karyawan menjadi tidak aktif dan mencegah karyawan tersebut melakukan absensi.
5. WHEN Admin memperbarui data karyawan, THE Sistem SHALL menyimpan perubahan tanpa mengubah Token_QR yang sudah ada.
6. THE Sistem SHALL menampilkan daftar karyawan yang dapat difilter berdasarkan departemen dan status aktif.

---

### Requirement 2: Pembuatan dan Distribusi QR Code

**User Story:** Sebagai Admin, saya ingin menghasilkan QR code unik untuk setiap karyawan, sehingga karyawan dapat menggunakannya sebagai identitas absensi yang aman.

#### Acceptance Criteria

1. WHEN karyawan baru berhasil ditambahkan, THE Sistem SHALL menghasilkan QR_Code yang memuat Token_QR terenkripsi milik karyawan tersebut.
2. THE Sistem SHALL menghasilkan Token_QR yang berbeda untuk setiap karyawan sehingga tidak ada dua karyawan yang memiliki Token_QR yang sama.
3. WHEN Admin meminta regenerasi QR code untuk karyawan tertentu, THE Sistem SHALL menghasilkan Token_QR baru dan menonaktifkan Token_QR lama milik karyawan tersebut.
4. WHEN Admin mengunduh QR code karyawan, THE Sistem SHALL menghasilkan file gambar QR_Code dalam format PNG dengan resolusi minimal 300x300 piksel.
5. WHERE fitur cetak massal diaktifkan, THE Sistem SHALL menghasilkan dokumen yang memuat QR_Code seluruh karyawan aktif dalam satu file PDF.
6. FOR ALL Token_QR yang dihasilkan, THE Sistem SHALL memastikan bahwa Token_QR dapat di-decode kembali menjadi identitas karyawan yang valid (properti round-trip: encode → decode → identitas karyawan).

---

### Requirement 3: Absensi Masuk dan Keluar via QR Code

**User Story:** Sebagai Karyawan, saya ingin melakukan absensi masuk dan keluar dengan memindai QR code saya, sehingga proses absensi menjadi cepat dan akurat tanpa perlu input manual.

#### Acceptance Criteria

1. WHEN Karyawan memindai QR_Code yang valid pada perangkat pemindai, THE QR_Scanner SHALL mencatat waktu absensi beserta identitas karyawan dan jenis absensi (masuk atau keluar) secara otomatis.
2. WHEN QR_Scanner berhasil membaca absensi, THE Sistem SHALL menampilkan konfirmasi yang memuat nama karyawan dan waktu absensi dalam waktu kurang dari 2 detik.
3. IF QR_Scanner menerima QR_Code yang tidak dikenali atau Token_QR tidak valid, THEN THE Sistem SHALL menampilkan pesan kesalahan dan tidak mencatat absensi.
4. IF Karyawan memindai QR_Code untuk absensi masuk lebih dari satu kali dalam satu Sesi_Absensi yang sama, THEN THE Sistem SHALL mengabaikan pemindaian berikutnya dan menampilkan notifikasi bahwa absensi sudah tercatat.
5. WHILE Sesi_Absensi masuk sedang berlangsung, THE Sistem SHALL membandingkan waktu pemindaian dengan batas waktu Sesi_Absensi dan menetapkan Status_Kehadiran sebagai "Hadir" atau "Terlambat" secara otomatis.
6. WHEN Karyawan memindai QR_Code untuk absensi keluar, THE Sistem SHALL mencatat waktu keluar dan menghitung durasi kerja karyawan pada hari tersebut.
7. IF Karyawan aktif tidak memiliki catatan absensi masuk pada hari kerja yang telah berlalu, THEN THE Sistem SHALL menetapkan Status_Kehadiran karyawan tersebut sebagai "Tidak Hadir" secara otomatis pada akhir hari kerja.

---

### Requirement 4: Manajemen Sesi Absensi dan Hari Kerja

**User Story:** Sebagai Admin, saya ingin mengonfigurasi jadwal kerja dan sesi absensi, sehingga sistem dapat menentukan status kehadiran karyawan secara akurat sesuai kebijakan perusahaan.

#### Acceptance Criteria

1. THE Sistem SHALL memungkinkan Admin untuk mendefinisikan Sesi_Absensi dengan parameter: nama sesi, waktu mulai, waktu selesai, dan toleransi keterlambatan dalam menit.
2. WHEN Admin menyimpan konfigurasi Sesi_Absensi dengan waktu mulai yang lebih besar atau sama dengan waktu selesai, THE Sistem SHALL menolak penyimpanan dan menampilkan pesan kesalahan yang menjelaskan konflik waktu.
3. THE Sistem SHALL memungkinkan Admin untuk menandai tanggal tertentu sebagai hari libur nasional atau cuti bersama, sehingga sistem tidak menghitung ketidakhadiran pada tanggal tersebut.
4. WHILE hari yang sedang berjalan adalah hari libur yang telah dikonfigurasi, THE Sistem SHALL menonaktifkan pencatatan absensi dan menampilkan informasi hari libur kepada pengguna.
5. THE Sistem SHALL mendukung konfigurasi hari kerja dalam seminggu (misalnya: Senin–Jumat atau Senin–Sabtu) yang berlaku sebagai acuan perhitungan kehadiran.

---

### Requirement 5: Rekap dan Pemantauan Data Kehadiran

**User Story:** Sebagai Admin, saya ingin melihat rekap data kehadiran karyawan, sehingga saya dapat memantau tingkat kehadiran tim dan mengidentifikasi pola ketidakhadiran.

#### Acceptance Criteria

1. THE Sistem SHALL menampilkan Rekap_Kehadiran yang dapat difilter berdasarkan: rentang tanggal, departemen, dan Status_Kehadiran.
2. WHEN Admin memilih rentang tanggal dan departemen, THE Sistem SHALL menampilkan Rekap_Kehadiran dalam waktu kurang dari 3 detik.
3. THE Sistem SHALL menampilkan ringkasan statistik kehadiran per karyawan yang mencakup: jumlah hari hadir, jumlah hari terlambat, jumlah hari tidak hadir, dan persentase kehadiran dalam rentang tanggal yang dipilih.
4. WHEN Admin memilih satu karyawan dari daftar rekap, THE Sistem SHALL menampilkan riwayat absensi harian karyawan tersebut beserta waktu masuk, waktu keluar, durasi kerja, dan Status_Kehadiran untuk setiap hari.
5. THE Sistem SHALL menampilkan indikator visual (misalnya: warna berbeda) untuk membedakan Status_Kehadiran pada tampilan rekap harian.
6. WHERE fitur notifikasi diaktifkan, THE Sistem SHALL mengirimkan ringkasan kehadiran harian kepada Admin melalui email pada waktu yang telah dikonfigurasi.

---

### Requirement 6: Export Data Kehadiran ke Excel

**User Story:** Sebagai Admin, saya ingin mengekspor data kehadiran ke file Excel, sehingga saya dapat menggunakan data tersebut untuk keperluan penggajian, audit, atau pelaporan manajemen.

#### Acceptance Criteria

1. WHEN Admin memilih rentang tanggal dan menekan tombol ekspor, THE Export_Engine SHALL menghasilkan file Excel (.xlsx) yang memuat data kehadiran sesuai filter yang dipilih.
2. THE Export_Engine SHALL menghasilkan file Excel yang memuat kolom minimal: NIK, Nama Karyawan, Departemen, Tanggal, Waktu Masuk, Waktu Keluar, Durasi Kerja, dan Status_Kehadiran.
3. WHEN Export_Engine menghasilkan file Excel, THE Sistem SHALL menyediakan file tersebut untuk diunduh oleh Admin dalam waktu kurang dari 10 detik untuk data hingga 10.000 baris.
4. IF rentang tanggal yang dipilih Admin tidak memiliki data kehadiran, THEN THE Export_Engine SHALL menghasilkan file Excel yang memuat header kolom tanpa baris data, disertai catatan bahwa tidak ada data pada rentang tersebut.
5. WHERE filter departemen diterapkan, THE Export_Engine SHALL menghasilkan file Excel yang hanya memuat data karyawan dari departemen yang dipilih.
6. THE Export_Engine SHALL menghasilkan file Excel dengan nama file yang mencerminkan konten, menggunakan format: `Rekap_Kehadiran_[Departemen]_[TanggalMulai]_[TanggalSelesai].xlsx`.
7. FOR ALL data kehadiran yang diekspor, THE Export_Engine SHALL memastikan bahwa total baris data dalam file Excel sama dengan jumlah catatan kehadiran yang ditampilkan pada layar rekap sebelum ekspor (properti konsistensi data).

---

### Requirement 7: Autentikasi dan Otorisasi Pengguna

**User Story:** Sebagai Admin, saya ingin sistem memiliki kontrol akses berbasis peran, sehingga hanya pengguna yang berwenang yang dapat mengakses fitur sensitif seperti manajemen data dan ekspor laporan.

#### Acceptance Criteria

1. THE Sistem SHALL mendukung dua peran pengguna: Admin dan Karyawan, dengan hak akses yang berbeda untuk setiap peran.
2. WHEN pengguna mengakses aplikasi, THE Sistem SHALL mewajibkan autentikasi menggunakan kombinasi nama pengguna dan kata sandi sebelum menampilkan konten apapun.
3. IF pengguna memasukkan kombinasi nama pengguna dan kata sandi yang salah sebanyak 5 kali berturut-turut, THEN THE Sistem SHALL mengunci akun tersebut selama 15 menit dan menampilkan pesan yang menginformasikan durasi penguncian.
4. WHILE pengguna dengan peran Karyawan sedang login, THE Sistem SHALL membatasi akses hanya pada fitur melihat riwayat kehadiran pribadi dan mengunduh QR code pribadi.
5. WHILE pengguna dengan peran Admin sedang login, THE Sistem SHALL memberikan akses penuh ke seluruh fitur manajemen karyawan, rekap kehadiran, dan ekspor data.
6. WHEN sesi pengguna tidak aktif selama 30 menit, THE Sistem SHALL mengakhiri sesi secara otomatis dan mengarahkan pengguna ke halaman login.

---

### Requirement 8: Izin dan Koreksi Kehadiran

**User Story:** Sebagai Admin, saya ingin dapat mencatat izin karyawan dan melakukan koreksi data absensi, sehingga data kehadiran mencerminkan kondisi aktual termasuk ketidakhadiran yang sah.

#### Acceptance Criteria

1. WHEN Admin mengajukan izin untuk karyawan pada tanggal tertentu dengan alasan yang valid, THE Sistem SHALL mengubah Status_Kehadiran karyawan pada tanggal tersebut menjadi "Izin" dan mencatat alasan izin.
2. WHEN Admin melakukan koreksi waktu absensi karyawan, THE Sistem SHALL menyimpan data koreksi beserta catatan alasan koreksi, nama Admin yang melakukan koreksi, dan waktu koreksi dilakukan.
3. THE Sistem SHALL menampilkan riwayat koreksi dan izin pada detail kehadiran karyawan sehingga perubahan data dapat diaudit.
4. IF Admin mencoba mengajukan izin untuk karyawan yang sudah memiliki catatan absensi masuk pada tanggal yang sama, THEN THE Sistem SHALL menampilkan peringatan konflik data dan meminta konfirmasi sebelum menimpa data yang ada.
