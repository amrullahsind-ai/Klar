# Cara Upload Klar ke Repo GitHub Baru

## 1. Buat repo baru
Di GitHub:
- New repository
- Nama contoh: `klar-app`
- Pilih Private dulu agar aman
- Jangan centang template lain jika ingin upload manual

## 2. Upload file
Upload SEMUA ISI folder ini ke repo baru.

Yang diupload adalah isi folder, bukan ZIP-nya.

File penting:
- `index.html`
- `admin.html`
- `employee.html`
- `credential-center.html`
- `master-apps-script-v5.gs`
- `admin-manifest.json`
- `employee-manifest.json`
- `service-worker.js`
- `klar-logo.png`
- `klar-logo.svg`
- `vercel.json`

## 3. Deploy ke Vercel
- Buka Vercel
- Add New Project
- Import repo `klar-app`
- Framework: Other / Static
- Build command: kosongkan
- Output directory: kosongkan atau `.`
- Deploy

## 4. Deploy Backend
- Buat Google Sheet master
- Extensions → Apps Script
- Paste isi `master-apps-script-v5.gs`
- Jalankan `setupMasterSheet()`
- Deploy → New deployment → Web app
- Execute as: Me
- Who has access: Anyone with the link
- Copy URL `/exec`

## 5. Jalankan app
Buka:
- `/admin.html` untuk admin
- `/employee.html` untuk karyawan
- `/credential-center.html` untuk ganti credential admin

Default demo:
- License code: `EDUPAY-DEMO-0001`
- Admin: `admin` / `1234`
- Karyawan: `G-001` / `1234`

## Catatan
Kalau app masih terlihat versi lama, lakukan hard refresh atau buka incognito.


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
