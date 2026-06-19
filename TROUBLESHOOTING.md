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
