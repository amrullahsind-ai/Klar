# Edura V5.1 Import Persistence Fix

Perbaikan utama:

1. Data karyawan hasil import tidak langsung ditimpa oleh refresh server lama.
2. Setelah import, local import guard aktif ±12 menit.
3. Import dikirim ulang ke server beberapa kali.
4. Backend menggabungkan karyawan dari server dan admin, bukan replace total.
5. Hapus permanen karyawan memakai tombstone `_deletedEmployees`.
6. Payroll snapshot hasil import dipertahankan agar tidak hilang oleh payload lama.

Kalau sebelumnya data sudah rusak/hilang, tes paling bersih tetap menggunakan lisensi/database baru atau bersihkan data lama dulu.
