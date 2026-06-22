# Klar V6.3 — Database Repair Fix

Versi ini memperbaiki error:

```text
Unexpected token 'D', "DEMO" is not valid JSON
```

Penyebabnya: kolom `payload` pada sheet `_database` berisi teks biasa seperti `DEMO`, bukan JSON database Klar.

## Yang diperbaiki

1. Backend sekarang punya action `ping` / `health`.
2. Backend punya action `repairDatabase`.
3. Jika payload rusak, backend membackup isi lama ke tab `_database_broken`.
4. Setelah backup, backend membuat database kosong valid sehingga admin/employee tidak crash.
5. Jika payload JSON ternyata ada di kolom lain, backend akan memindahkannya ke kolom payload yang benar.

## Tes URL

```text
WEB_APP_URL?action=ping&callback=test
```

Hasil benar:

```text
test({"ok":true,...})
```

Untuk repair manual:

```text
WEB_APP_URL?action=repairDatabase&licenseCode=EDUPAY-DEMO-0001&callback=test
```

Untuk reset paksa:

```text
WEB_APP_URL?action=repairDatabase&licenseCode=EDUPAY-DEMO-0001&force=1&callback=test
```

## Catatan penting

Kalau database direset, data lama yang rusak dipindah ke `_database_broken`. Setelah itu buka Admin, import/sync ulang data yang benar.
