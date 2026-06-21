# Edura V5.3 Hard Delete + Stability Fix

Versi ini memperbaiki hapus karyawan agar langsung menghapus dari server melalui endpoint khusus `deleteEmployee`, bukan hanya menunggu autosync.

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


## Fitur Import Excel V4.5

Versi ini menambahkan menu **Import Excel** di Edura Admin. Admin bisa:

- download `template-import-edura.xlsx`;
- upload Excel lama sekolah/yayasan;
- preview sheet dan baris data;
- mapping kolom untuk Excel bebas;
- import data karyawan, jabatan, golongan, komponen gaji, potongan, dan payroll awal;
- menyimpan payroll awal sebagai snapshot terkunci agar slip lama tidak berubah saat aturan gaji diedit.

Catatan: fitur import Excel memakai library pembaca Excel dari CDN saat tombol import dipakai. Jadi perangkat admin perlu internet saat melakukan import.


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


## Catatan V4.9 Import Kode-Nama
Versi ini memperbaiki Excel legacy yang kolom nama berisi kode. PER UNIT menjadi sumber utama payroll awal; sheet ABSENSI PER TMT dilewati default karena dapat berisi data lawas.


## V5.0 Import Stability + UI Fix
- Tombol aksi tabel dibuat menyamping.
- Import Excel menolak baris judul/header agar tidak masuk sebagai karyawan.
- Data karyawan dari Excel tidak langsung hilang saat pindah ke Payroll karena refresh server ditahan sampai autosync berjalan.
- Jabatan/golongan hasil import tidak direset otomatis hanya karena jumlahnya banyak.


## Edura V5.1 Import Persistence Fix

Versi ini memperbaiki bug data Excel yang hilang setelah pindah tab/refresh. Setelah import, data lokal dikunci sementara dan dikirim ulang ke server. Backend juga menggabungkan data karyawan agar import tidak hilang karena autosync payload lama.


## V5.2 Delete Realtime Fix
- Hapus karyawan langsung hilang dari tabel tanpa reload.
- Tombstone karyawan yang dihapus dipertahankan saat refresh server agar data lama tidak muncul kembali.
- Setelah hapus, aplikasi menahan refresh server sebentar dan memaksa sync penghapusan ke Apps Script.
