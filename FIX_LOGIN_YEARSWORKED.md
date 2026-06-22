# Fix Login Karyawan: `yearsWorked is not defined`

Penyebab: Apps Script yang sedang aktif masih memakai pemanggilan `yearsWorked(...)`, tetapi fungsi helper tersebut tidak ada di versi backend yang terdeploy. Error ini muncul dari backend saat `employee.html` memanggil action `loadEmployee`, jadi login terlihat gagal walaupun username dan password benar.

Solusi:
1. Buka Google Apps Script yang menjadi License Server URL.
2. Ganti isi script dengan `master-apps-script-v5.gs` dari paket ini.
3. Deploy → Manage deployments → Edit → pilih **New version** → Deploy.
4. Buka `employee.html` via incognito / hard refresh.

Paket ini menambahkan alias kompatibilitas:

```js
function yearsWorked(join, imported){ return years_(join, imported); }
```

Jadi versi lama yang masih memanggil `yearsWorked` tidak lagi error.
