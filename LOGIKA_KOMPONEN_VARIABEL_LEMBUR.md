# Rancangan Modul Komponen Variabel & Lembur

Untuk tunjangan seperti lembur, transport khusus, piket hari libur, pengganti mengajar, dan bonus lain yang tidak bisa digeneralisasi, Klar sebaiknya punya modul baru.

## Struktur yang dibutuhkan

- Kalender sekolah: hari aktif, libur mingguan, tanggal merah, libur yayasan.
- Jadwal karyawan: jam kerja normal per karyawan/unit/jabatan.
- Penugasan khusus: siapa diminta masuk di hari libur atau di luar jam normal.
- Aturan komponen variabel: rumus nominal, perlu approval atau tidak, sumber dari absensi/jadwal/manual.
- Approval lembur: admin/kepala sekolah menyetujui sebelum masuk payroll.

## Contoh aturan

- Jika karyawan check-in pada hari libur dan ada penugasan khusus → hitung `Lembur Hari Libur`.
- Jika karyawan check-out melewati batas malam → hitung `Lembur Malam`.
- Jika guru menggantikan kelas orang lain → masuk `Tunjangan Pengganti Mengajar`.

## Kenapa belum langsung disatukan ke aturan gaji umum?

Karena komponen variabel tidak selalu sama untuk semua karyawan. Ia tergantung tanggal, jadwal, penugasan, approval, dan absensi. Kalau dipaksakan menjadi komponen general, nominal payroll akan sering salah.
