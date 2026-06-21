# Edura V6 Stable UI Notes

Versi ini memakai arah UI/UX dari file contoh yang diberikan:
- landing page lebih premium
- sidebar admin lebih rapi
- tombol dan card lebih konsisten
- employee PWA lebih modern

Namun script admin contoh yang diupload belum lengkap. Di versi ini, UI tersebut disambungkan kembali dengan logic stabil dari Edura V5.3:
- deleteEmployee hard endpoint
- import persistence guard
- autosync
- payroll
- monitor absensi
- import Excel
- multi lokasi
- device approval

Catatan testing:
1. Upload semua isi folder ke Vercel/GitHub.
2. Deploy ulang Apps Script dari `master-apps-script-v5.gs`.
3. Buka incognito/hard refresh.
4. Uji: login admin, import Excel, hapus karyawan, payroll, login karyawan, check-in.
