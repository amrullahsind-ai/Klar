# Troubleshooting Edura V4

## Muncul: Gagal akses server

Artinya Employee/Admin PWA tidak bisa mengakses License Server. Ini bukan masalah NIP/PIN.

Cek:

1. License Server URL harus dari Google Apps Script Web App, bentuknya:
   `https://script.google.com/macros/s/AKfycb.../exec`

2. Jangan isi License Server URL dengan link Vercel/GitHub. Vercel hanya untuk `admin.html` dan `employee.html`.

3. Di Apps Script, deploy harus:
   - Execute as: Me
   - Who has access: Anyone with the link

4. Setelah edit Apps Script, wajib Deploy ulang atau Manage deployments -> Edit -> New version.

5. Buka URL Apps Script langsung di browser. Kalau muncul teks semacam `callback({"ok":false...})` atau error JSONP, server hidup. Kalau minta login/permission, deployment salah.

6. Di Employee login, klik `Ganti Server/Kode Lisensi`, lalu isi ulang URL dan kode lisensi.


## Catatan sinkronisasi hapus data

Kalau admin menghapus karyawan/status absensi di aplikasi, Google Sheet akan ikut bersih setelah admin menekan tombol **Sync**. Versi fix ini memakai pola **replace database**, bukan append. Jadi tab mirror seperti `_attendance`, `_employees`, dan `_requests` akan dibersihkan lalu ditulis ulang sesuai data terbaru.

Untuk karyawan yang sudah punya histori payroll, pilihan paling aman adalah ubah status menjadi **Nonaktif**, bukan hapus permanen. Hapus permanen dipakai jika data benar-benar salah atau duplikat.


## Update Autosync

Versi ini memakai autosync di Admin PWA. Setelah admin menyimpan karyawan, aturan gaji, aturan absensi, approval izin/sakit, alpha, payroll final, atau branding, data tetap disimpan ke localStorage dulu lalu otomatis dikirim ke server dalam beberapa detik. Tombol Sync Manual tetap tersedia sebagai cadangan. Jika koneksi putus, data tetap aman di browser dan dapat dikirim ulang saat koneksi/server sudah benar.


## Input License Server URL seperti terhapus
Penyebab paling sering:
1. Yang dimasukkan adalah link Google Sheet, bukan URL Apps Script Web App.
2. Apps Script belum dideploy sebagai Web App.
3. URL tidak berakhiran `/exec`.
4. Browser masih menyimpan versi lama lewat cache/service worker.

Solusi:
- Pakai URL Apps Script Web App: `https://script.google.com/macros/s/.../exec`.
- Setelah update file di Vercel, buka DevTools → Application → Service Workers → Unregister, atau buka tab incognito untuk tes cepat.
- Klik Ganti Lisensi/Ganti Server, masukkan ulang URL dan kode lisensi.


## Bug aktivasi input hilang setelah klik
Kalau input URL/kode lisensi hilang setelah klik Aktivasi, biasanya file HTML sebelumnya punya error JavaScript sehingga form reload. Versi ini memperbaiki error tersebut. Setelah upload ke Vercel, lakukan hard refresh atau buka Incognito supaya cache lama tidak dipakai.

Pastikan URL yang dimasukkan adalah Apps Script Web App URL yang berakhiran `/exec`, bukan link Google Sheet.


## Error: yearsWorked is not defined
Penyebab: backend Apps Script memanggil fungsi `yearsWorked()` untuk profil karyawan, tetapi file Apps Script yang ter-deploy belum punya fungsi itu.
Solusi: paste ulang `master-apps-script-v5.gs` dari paket hotfix ini, lalu Apps Script > Deploy > Manage deployments > Edit > New version > Deploy.


## Patch terbaru
- Monitor Absensi dan Payroll otomatis mengambil data terbaru dari server, jadi check-in karyawan langsung terbaca admin setelah refresh/masuk menu.
- Backend menggabungkan absensi dari karyawan dengan data admin supaya autosync admin tidak menimpa absensi baru dari server.
- Hapus status absensi dari admin memakai tombstone sehingga data di Sheet/server ikut bersih.
- Kontrol logo sekarang mengatur ukuran logo di dalam frame, posisi X/Y, dan warna live preview.


## Import Excel tidak jalan

Kemungkinan penyebab:

1. Internet admin tidak aktif saat import. Pembaca Excel dimuat dari CDN.
2. File Excel terlalu bebas/berantakan. Gunakan template resmi `template-import-edura.xlsx` agar paling aman.
3. Nama kolom tidak terbaca. Pakai mapping manual pada menu Import Excel.
4. Payroll awal tidak masuk karena nama/NIP di sheet Payroll Awal tidak cocok dengan data karyawan. Import karyawan dulu, baru import payroll awal.


## Update V4.6 — Import Excel Fleksibel

Import Excel sekarang tidak bergantung pada nama sheet `Karyawan`, `Golongan`, atau `Payroll Awal`. Admin bisa upload Excel lama dengan banyak tab dan nama sheet bebas. Edura akan:

- scan semua sheet;
- mencari baris header otomatis walaupun ada judul di atas;
- menebak jenis sheet: karyawan, jabatan, golongan, komponen, potongan, atau payroll;
- menampilkan analisis semua sheet;
- memberi pilihan centang/lewati sheet;
- mengizinkan admin mengubah mode sheet;
- tetap menyediakan mapping manual untuk sheet aktif.

Untuk Excel gaji lama yang bentuknya kompleks, gunakan mode **Fleksibel / Scan Semua Sheet**, cek hasil analisis, lalu baru klik **Terapkan Import**.


## Update V4.7 Flexible Import Fix
- Import Excel kini menggabungkan data antar sheet memakai KODESLIP/NRK agar payroll yang berisi kode seperti AA1 tetap bisa memakai nama asli dari sheet master.
- Deteksi header lebih fleksibel: header boleh tidak berada di baris pertama.
- Kolom masa kerja, join date, grade khusus, unit, rekening, dan gaji payroll seperti GAJI POKOK/TUNJANGAN/POTONGAN/GAJI BERSIH ikut dibaca.
- Preview import sekarang menampilkan hasil terjemahan: Nama, Kode Slip, NRK, Jabatan, Golongan, Masa Kerja, Gaji Pokok, Tunjangan, Potongan, dan Gaji Bersih.
- Sheet PER UNIT cocok dijadikan Payroll Awal, ABSENSI PER TMT cocok jadi master karyawan, Gapok jadi Golongan, dan TJ. FUNGSIONAL jadi Jabatan.


## Update V4.8 Import Excel Stabil
Import Excel sekarang tidak lagi asal mengambil semua teks. Sheet slip/pinjaman/potongan dilewati default, kode seperti AA1 hanya dipakai jika berhasil dicocokkan ke nama asli, dan payroll dari PER UNIT mengikuti nominal Excel sebagai snapshot awal.


## V5.0 Import Stability + UI Fix
- Tombol aksi tabel dibuat menyamping.
- Import Excel menolak baris judul/header agar tidak masuk sebagai karyawan.
- Data karyawan dari Excel tidak langsung hilang saat pindah ke Payroll karena refresh server ditahan sampai autosync berjalan.
- Jabatan/golongan hasil import tidak direset otomatis hanya karena jumlahnya banyak.


## V5.2 Delete Realtime Fix
- Hapus karyawan langsung hilang dari tabel tanpa reload.
- Tombstone karyawan yang dihapus dipertahankan saat refresh server agar data lama tidak muncul kembali.
- Setelah hapus, aplikasi menahan refresh server sebentar dan memaksa sync penghapusan ke Apps Script.
