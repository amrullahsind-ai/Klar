# Panduan Deploy Klar V4

## 1. Setup License Server

1. Buat Google Sheet baru: `Klar Master`.
2. Buka `Extensions -> Apps Script`.
3. Paste isi `master-apps-script-v5.gs`.
4. Klik Save.
5. Jalankan fungsi `setupMasterSheet()` sekali.
6. Izinkan akses.
7. Klik `Deploy -> New deployment`.
8. Type: `Web app`.
9. Execute as: `Me`.
10. Who has access: `Anyone with the link`.
11. Klik Deploy.
12. Copy Web App URL. Itulah **License Server URL**.

## 2. Deploy Aplikasi

Upload file ini ke GitHub private lalu deploy ke Vercel/Netlify/GitHub Pages:

- `admin.html`
- `employee.html`
- `credential-center.html`
- `admin-manifest.json`
- `employee-manifest.json`
- `service-worker.js`

Contoh link akhir:

- `https://edupay-namasekolah.vercel.app/admin.html`
- `https://edupay-namasekolah.vercel.app/employee.html`
- `https://edupay-namasekolah.vercel.app/credential-center.html`

## 3. Alur Pemakaian Awal

1. Buka `admin.html`.
2. Isi License Server URL.
3. Isi kode lisensi `EDUPAY-DEMO-0001`.
4. Login admin: `admin` / `1234`.
5. Atur lokasi sekolah di menu Aturan Absensi.
6. Tambah/edit karyawan dan PIN karyawan.
7. Klik Sync.
8. Buka `employee.html`.
9. Isi server dan kode lisensi yang sama.
10. Login karyawan dengan NIP/PIN.
11. Coba check-in.

## Catatan GPS

PWA GPS membutuhkan HTTPS. Vercel/Netlify sudah HTTPS. Kalau dibuka via file lokal, GPS bisa gagal.


## Update Autosync

Versi ini memakai autosync di Admin PWA. Setelah admin menyimpan karyawan, aturan gaji, aturan absensi, approval izin/sakit, alpha, payroll final, atau branding, data tetap disimpan ke localStorage dulu lalu otomatis dikirim ke server dalam beberapa detik. Tombol Sync Manual tetap tersedia sebagai cadangan. Jika koneksi putus, data tetap aman di browser dan dapat dikirim ulang saat koneksi/server sudah benar.


## Patch terbaru
- Monitor Absensi dan Payroll otomatis mengambil data terbaru dari server, jadi check-in karyawan langsung terbaca admin setelah refresh/masuk menu.
- Backend menggabungkan absensi dari karyawan dengan data admin supaya autosync admin tidak menimpa absensi baru dari server.
- Hapus status absensi dari admin memakai tombstone sehingga data di Sheet/server ikut bersih.
- Kontrol logo sekarang mengatur ukuran logo di dalam frame, posisi X/Y, dan warna live preview.


## Fitur Import Excel V4.5

Versi ini menambahkan menu **Import Excel** di Klar Admin. Admin bisa:

- download `template-import-klar.xlsx`;
- upload Excel lama sekolah/yayasan;
- preview sheet dan baris data;
- mapping kolom untuk Excel bebas;
- import data karyawan, jabatan, golongan, komponen gaji, potongan, dan payroll awal;
- menyimpan payroll awal sebagai snapshot terkunci agar slip lama tidak berubah saat aturan gaji diedit.

Catatan: fitur import Excel memakai library pembaca Excel dari CDN saat tombol import dipakai. Jadi perangkat admin perlu internet saat melakukan import.


## Update V4.6 — Import Excel Fleksibel

Import Excel sekarang tidak bergantung pada nama sheet `Karyawan`, `Golongan`, atau `Payroll Awal`. Admin bisa upload Excel lama dengan banyak tab dan nama sheet bebas. Klar akan:

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
