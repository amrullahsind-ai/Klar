# Edura V4.4 - Payroll UI Clean Fix


Ini paket ulang dari nol. Abaikan ZIP sebelumnya.

## Isi Paket

- `admin.html` — PWA admin untuk payroll, karyawan, aturan gaji, aturan absensi GPS, monitor, approval, laporan.
- `employee.html` — PWA karyawan khusus check-in/check-out, izin, sakit, riwayat, slip sendiri.
- `credential-center.html` — halaman privat untuk ganti username/PIN admin.
- `master-apps-script-v5.gs` — backend Google Apps Script: license server + database + absensi employee.
- `admin-manifest.json`, `employee-manifest.json`, `service-worker.js` — file PWA dasar.
- `struktur-database-v4.md` — struktur database.
- `panduan-deploy.md` — cara deploy.
- `template-lisensi.csv` — contoh kumpulan kode lisensi.

## Login Demo

Admin:
- username: `admin`
- PIN: `1234`

Karyawan demo:
- NIP/Login: `G-001`
- PIN: `1234`

## Konsep

- Admin PWA dipakai bendahara/admin sekolah.
- Employee PWA dipakai karyawan/guru/staff.
- Admin mengatur radius GPS, jam masuk, batas telat, approval izin/sakit.
- Karyawan hanya bisa absensi, izin, sakit, lihat riwayat, dan lihat slip sendiri.
- Alpha ditandai admin dari Monitor Absensi.
- Payroll otomatis membaca rekap absensi harian.

## License Server URL dapat dari mana?

Dari Apps Script Web App URL setelah deploy `master-apps-script-v5.gs`.



## Catatan sinkronisasi hapus data

Kalau admin menghapus karyawan/status absensi di aplikasi, Google Sheet akan ikut bersih setelah admin menekan tombol **Sync**. Versi fix ini memakai pola **replace database**, bukan append. Jadi tab mirror seperti `_attendance`, `_employees`, dan `_requests` akan dibersihkan lalu ditulis ulang sesuai data terbaru.

Untuk karyawan yang sudah punya histori payroll, pilihan paling aman adalah ubah status menjadi **Nonaktif**, bukan hapus permanen. Hapus permanen dipakai jika data benar-benar salah atau duplikat.


## Update Autosync

Versi ini memakai autosync di Admin PWA. Setelah admin menyimpan karyawan, aturan gaji, aturan absensi, approval izin/sakit, alpha, payroll final, atau branding, data tetap disimpan ke localStorage dulu lalu otomatis dikirim ke server dalam beberapa detik. Tombol Sync Manual tetap tersedia sebagai cadangan. Jika koneksi putus, data tetap aman di browser dan dapat dikirim ulang saat koneksi/server sudah benar.


## Hotfix Aktivasi Tidak Hilang
Versi ini memperbaiki layar aktivasi agar input License Server URL dan kode lisensi tidak hilang ketika load gagal atau halaman direfresh.

Penting: License Server URL bukan link Google Sheet. Yang benar adalah URL Apps Script Web App yang berakhiran `/exec`, contoh:

`https://script.google.com/macros/s/AKfycbxxxxxxxx/exec`

Kalau memasukkan link Google Sheet seperti `https://docs.google.com/spreadsheets/...`, aplikasi akan menolak dan menampilkan pesan yang lebih jelas.


## Hotfix yearsWorked
Jika muncul error `yearsWorked is not defined`, berarti Apps Script lama belum punya fungsi hitung masa kerja. Gunakan `master-apps-script-v5.gs` dari paket ini, lalu deploy ulang versi baru.


## Update Hotfix: Refresh, Maps, Slip Terkirim, dan Anti Double Check-in

Versi ini menambahkan:
- Tombol Refresh Data di Admin dan Employee PWA.
- Check-in/check-out memakai response server langsung agar tidak terasa menggantung.
- Karyawan tidak bisa check-in dua kali pada hari yang sama kecuali admin menghapus status absensi hari itu.
- Slip gaji tidak otomatis muncul di karyawan. Admin harus klik Kirim Slip atau Kirim Semua Slip setelah payroll final.
- Aturan absensi menampilkan peta lokasi dan penjelasan radius vs akurasi GPS.
- Hapus data di admin tetap dibersihkan di mirror Google Sheet saat autosync berikutnya.

Setelah mengganti file, deploy ulang HTML di Vercel dan deploy ulang Apps Script dengan versi baru.


## Update V4.1: Login Nama + Multi Titik Absensi

- Employee PWA bisa login memakai `Nama/Login` karyawan. Admin bisa mengatur nama login di form karyawan. NIP lama tetap bisa dipakai sebagai cadangan.
- Karyawan bisa mengganti password sendiri dari menu Profil Saya. Perubahan masuk ke backend server melalui Apps Script.
- Aturan absensi mendukung banyak titik/lokasi. Contoh: TK 1, SD 1, SMP, kantor yayasan.
- Check-in diterima jika karyawan berada dalam radius salah satu titik aktif.
- Record absensi menyimpan lokasi diterima (`locationName`) dan jarak dari titik tersebut.

Catatan: Vercel hanya hosting frontend. Data login, password hash, lokasi, absensi, dan payroll tetap tersimpan di backend Apps Script/Google Sheet master. Kalau ingin benar-benar tanpa Google Sheet, backend harus pindah ke Supabase/Firebase/Neon, karena frontend Vercel saja tidak bisa menyimpan database permanen.


## Patch terbaru
- Monitor Absensi dan Payroll otomatis mengambil data terbaru dari server, jadi check-in karyawan langsung terbaca admin setelah refresh/masuk menu.
- Backend menggabungkan absensi dari karyawan dengan data admin supaya autosync admin tidak menimpa absensi baru dari server.
- Hapus status absensi dari admin memakai tombstone sehingga data di Sheet/server ikut bersih.
- Kontrol logo sekarang mengatur ukuran logo di dalam frame, posisi X/Y, dan warna live preview.


## Update V4.3
- Notifikasi kanan atas untuk perubahan admin.
- Device lock: karyawan hanya bisa login di device aktif; device baru wajib approval admin.
- Absensi di luar radius atau lewat batas approval telat masuk pengajuan admin, bukan langsung dihitung.
- Golongan diambil dari contoh Excel dan mempengaruhi gaji pokok serta tunjangan kehadiran.
- Jabatan fungsional diambil dari contoh Excel dan mempengaruhi tunjangan fungsional/rumah.
- Lihat `ANALISIS_SAMPLE_GAJI.md` untuk ringkasan mapping dari Excel.


## Catatan V4.4
- Excel sample sekarang dipakai sebagai contoh aturan, bukan diimpor semua master jabatan/golongan.
- Default jabatan dan golongan dibuat ringkas agar UI tidak penuh.
- Bug gaji Rp0 diperbaiki lewat fallback `baseSalary/salary` dan normalisasi data karyawan.
- Warna Edura dikunci untuk brand identity.
- Daftar panjang dibatasi di halaman utama; klik `Lihat semua` untuk membuka modal tengah.
