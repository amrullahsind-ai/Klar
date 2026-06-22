# Klar V5.0 Import Stability + UI Fix

Perbaikan utama:

1. Tombol aksi tabel seperti Edit/Hapus dibuat menyamping dengan `.row-actions`, bukan bertumpuk.
2. Import Excel lebih ketat memfilter baris judul/header seperti NAMA, KODESLIP, NRK, GAJI POKOK, TOTAL, dan baris judul yayasan.
3. Mode payroll Excel sekarang menerima kode seperti AA1/AA2 sebagai identitas karyawan valid, tetapi hanya jika baris punya nominal gaji valid.
4. Setelah import, Klar menahan refresh server beberapa detik agar data import lokal tidak tertimpa data server lama sebelum autosync selesai.
5. Normalisasi database tidak lagi mereset jabatan/golongan impor hanya karena jumlahnya lebih dari 12, sehingga data dari Excel tidak hilang saat pindah tab.

Catatan: kalau sebelumnya sudah terlanjur mengimport data rusak, hapus data import lama atau tes dengan lisensi/database baru untuk hasil paling bersih.
