# Analisis `sample gaji.xlsx` untuk Edura V4.4

## Keputusan terbaru
File Excel dipakai sebagai **contoh aturan dan format perhitungan**, bukan dimasukkan mentah-mentah seluruh master jabatannya.

Yang diambil dari Excel:
- pola bahwa golongan mempengaruhi gaji pokok;
- pola tunjangan hadir harian dan tunjangan hadir full/bulan;
- pola tunjangan fungsional jabatan;
- pola tunjangan rumah;
- pola tunjangan masa kerja;
- pola potongan absensi/BPJS/pinjaman sebagai komponen potongan;
- struktur slip gaji: identitas, penghasilan, potongan, total bersih.

Yang tidak dimasukkan otomatis:
- seluruh jabatan detail seperti kepala/deputi/unit panjang;
- seluruh 90 baris golongan;
- seluruh nama/karyawan dari Excel.

## Struktur default Edura
Default sekarang dibuat ringkas:
- beberapa jabatan inti sekolah/yayasan;
- beberapa golongan contoh 1A sampai 3B;
- nominal bisa diedit admin;
- payroll membaca aturan yang dipilih di karyawan.

## Rumus payroll yang dipakai
`Gaji pokok golongan + tunjangan hadir golongan + tunjangan golongan + tunjangan fungsional jabatan + tunjangan rumah + tunjangan masa kerja + komponen custom - potongan = gaji bersih`

## Catatan bug yang diperbaiki
Jika sebelumnya jabatan/golongan dari Excel terlalu banyak atau ID karyawan tidak cocok, payroll bisa terbaca Rp0. V4.4 menormalisasi data agar karyawan selalu memakai jabatan/golongan valid dan base salary dibaca dari `baseSalary`/`salary` fallback.
