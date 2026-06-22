# Klar V6.1 Stable Pilot Fix

Perubahan utama:

1. **Modal daftar besar tidak tertutup saat hapus karyawan**  
   Jika admin membuka `Lihat semua` lalu menghapus satu karyawan, modal tetap terbuka dan daftar langsung diperbarui.

2. **Import Excel lebih aman untuk nominal payroll**  
   Import payroll sekarang membaca semua header bernilai uang yang mengandung kata seperti `tunjangan`, `insentif`, `bonus`, `lembur`, `subsidi`, `beasiswa`, `potongan`, `pinjaman`, `ziswaf`, `bpjs`, dll.  
   Kalau Excel memiliki kolom `Gaji Bersih`, nominal itu dipertahankan sebagai sumber utama. Selisih otomatis dimasukkan sebagai koreksi agar total snapshot tetap sama dengan Excel.

3. **Komponen variabel otomatis dibuat**  
   Tunjangan/potongan hasil import dibuat sebagai komponen variabel dengan nominal 0 di aturan umum, karena nominal sebenarnya ada per karyawan di snapshot payroll.

4. **Login karyawan lebih jelas**  
   Backend `master-apps-script-v5.gs` mendukung login memakai NIP, Login, Nama, atau kode/slipCode. Untuk karyawan hasil import, default password adalah `1234` selama admin belum menggantinya.

5. **Catatan penting tentang lembur/jadwal**  
   Lembur berbasis kalender sekolah, tanggal merah, jadwal shift, dan approval belum dijadikan otomatis penuh. Itu harus menjadi modul baru: `Jadwal & Komponen Variabel` agar tidak merusak payroll.
