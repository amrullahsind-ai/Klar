# Edura V6.1 — Catatan Stabilitas, Import Excel, Login Karyawan, dan Lembur

## 1. Hapus karyawan dari modal daftar lengkap
Perubahan: ketika admin membuka daftar lengkap karyawan lalu menghapus satu karyawan, modal tidak langsung tertutup. Isi modal dirender ulang agar admin tetap bisa lanjut menghapus/mengelola data.

Catatan: untuk data produksi, hapus permanen sebaiknya hanya untuk data salah import/duplikat. Karyawan yang sudah punya riwayat payroll sebaiknya diarsipkan/nonaktifkan.

## 2. Import Excel payroll
Perubahan penting: payroll import diperlakukan sebagai snapshot. Kolom `Gaji Bersih/THP/Transfer` dijadikan angka final utama. Semua kolom numeric yang berbentuk tunjangan/potongan akan disimpan sebagai detail slip.

Kolom yang dibaca sebagai tunjangan antara lain: `Tunj.`, `TJ`, `Subsidi`, `Beasiswa`, `Insentif`, `Lembur`, `Makan`, `Eskul`, `Suka/Duka`, `BPJS Kesehatan`, dan semacamnya.

Kolom yang dibaca sebagai potongan antara lain: `Potongan`, `Pot.`, `Pinjaman`, `ZISWAF`, `Iuran`, `Biaya Pendidikan`, `BPJS Potongan`, dan semacamnya.

Jika total hitungan Edura tidak sama dengan `Gaji Bersih` Excel, Edura menambah baris `Penyesuaian agar sesuai Gaji Bersih Excel`. Ini sengaja agar nominal akhir slip import sama dengan Excel lama.

## 3. Login karyawan dari hasil import
Perubahan: karyawan yang dibuat otomatis dari payroll import sekarang memakai kode/nama Excel sebagai `name`, `loginName`, dan `nip` utama. PIN awal tetap `1234`.

Alur yang disarankan:
1. Import Excel.
2. Sync ke server.
3. Tunggu beberapa detik.
4. Karyawan login memakai kode/nama yang muncul di tabel Karyawan + PIN `1234`.

Jika masih gagal, kemungkinan Apps Script/backend belum versi terbaru atau belum menerima payload hasil sync.

## 4. Lembur dan tunjangan berbasis kejadian
Lembur tidak boleh dibuat sebagai komponen general biasa. Lembur perlu rule engine:

- Kalender kerja sekolah: hari kerja, tanggal merah, libur yayasan, event khusus.
- Jadwal/shift per karyawan atau per unit.
- Penugasan lembur: siapa yang diminta masuk saat libur atau pulang malam.
- Klasifikasi absensi: normal, telat, pulang cepat, lembur malam, lembur hari libur.
- Aturan hitung: per jam, per hari, per sesi, atau flat.
- Payroll membaca hasil klasifikasi lalu membuat komponen slip otomatis.

Rumus umum:
`Lembur = jumlah_jam_atau_sesi × tarif_lembur`, dengan bukti dari absensi dan jadwal.
