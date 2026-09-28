# Plan Manajemen User — SmartLoan

Referensi: `SmartLoan_Keycloak_Studi_Kasus.pdf`. Scope ini mencakup Fase 1 (fondasi realm/seed), Fase 2 (autentikasi & JIT provisioning), dan Fase 6 (Admin API) dari brief.

## 1. Keycloak realm & seed (fondasi)
- `docker-compose.yml`: Keycloak + Postgres
- Realm `smartloan`: brute-force protection, password policy (min 10 karakter + angka), access token lifespan 5 menit
- Client `smartloan-web` (public, PKCE) dan `smartloan-api` (confidential, audience mapper → `aud: smartloan-api`)
- Client `smartloan-admin-svc` (service account, role `realm-management`: `view-users`, `manage-users` saja — jangan `manage-realm`)
- Realm roles: `BORROWER`, `STAFF`, `BRANCH_MANAGER` (composite → `STAFF`), `SUPER_ADMIN`
- Groups `/branches/JKT`, `/branches/SBY`, `/branches/MLG` + protocol mapper claim `branch_code`
- 7 user uji (lihat tabel di hal. 3 brief), termasuk `eko` yang disabled
- Export semua ini jadi realm JSON (`realm-export.json`) agar reproducible via `docker-compose up`
- **PASS**: `docker compose up` sampai realm ter-import otomatis, token bisa didapat untuk 7 user

## 2. Modul `auth/` — prasyarat semua endpoint user
- `AuthGuard` global: verifikasi JWT via JWKS (cache key, iss/aud/exp/signature)
- Decorator `@Public()`, `@Roles()`, `@CurrentUser()` (kembalikan `{sub, email, roles, branchCode}` dari token)
- **PASS**: `/health` publik tanpa token, endpoint lain 401 tanpa/salah token

## 3. Modul `users/` — profil lokal + JIT provisioning
- Entity `users` (field sesuai 3.2 brief — **tanpa kolom password/role**)
- Service: JIT provisioning saat `GET /me` dipanggil pertama kali (cari by `keycloak_id`, kalau belum ada → insert), aman terhadap request paralel (unique constraint + handle race)
- Controller `GET /me`
- **PASS**: request pertama bikin 1 baris `users`, 10 request paralel tetap cuma 1 baris

## 4. Modul `keycloak-admin/` — jembatan ke Keycloak Admin API
- Client credentials grant untuk `smartloan-admin-svc`, token di-cache & di-refresh (jangan minta token baru tiap request)
- Wrapper untuk create user, set password, assign role, assign group, enable/disable

## 5. Modul `admin-users/` — endpoint manajemen user oleh SUPER_ADMIN
- `POST /admin/users`: buat user di Keycloak (set temporary password + required action `UPDATE_PASSWORD`, assign role, masukkan ke group cabang) → lalu insert ke `users` lokal. Kalau insert lokal gagal, **rollback**: hapus user yang sudah terbuat di Keycloak (kompensasi)
- `PATCH /admin/users/:id/status`: disable/enable di Keycloak (cabut sesi aktif) + sync `is_active` di lokal
- Guard: hanya `SUPER_ADMIN` (pakai `@Roles()`, bukan hardcode string di controller)
- **PASS**: user baru bisa login & ganti password, `GET /me` tidak duplikat profil; user disabled tidak bisa login/refresh

## Urutan eksekusi
Mulai dari langkah 1 (realm+seed) karena semua modul berikutnya butuh Keycloak jalan dan token nyata untuk ditest — sesuai batasan brief "satu fase, satu commit/PR".
