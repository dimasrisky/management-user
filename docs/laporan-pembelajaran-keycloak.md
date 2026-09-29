# Laporan Pembelajaran: Integrasi Keycloak dengan NestJS

**Project:** management-user
**Tanggal:** 2026-09-29

## 1. Tujuan

Mempelajari cara mengintegrasikan Keycloak sebagai Identity Provider (IdP) ke dalam backend NestJS, mencakup autentikasi berbasis JWT, otorisasi berbasis role/group, serta sinkronisasi data user antara Keycloak dan database aplikasi.

## 2. Konsep Dasar Keycloak yang Dipelajari

| Konsep | Definisi | Contoh di project ini |
|---|---|---|
| **Realm** | Ruang isolasi penuh: punya user, client, role, group sendiri-sendiri, tidak saling terlihat antar realm. Satu instance Keycloak bisa menampung banyak realm (mis. satu per aplikasi/tenant). | Realm `user-management` — terpisah dari realm `master` (realm bawaan untuk admin console Keycloak sendiri). |
| **Client** | Representasi aplikasi/service yang boleh minta token ke realm. Ada 2 tipe: **public** (tidak pegang secret, dipakai SPA/mobile) dan **confidential** (pegang secret, dipakai backend). | `user-management-web` (public, login user), `user-management-api` (confidential, resource server), `user-management-admin-svc` (confidential + service account, dipakai backend untuk Admin API). |
| **Grant Type / Flow** | Cara client menukar kredensial jadi token. **Authorization Code** untuk user login lewat browser, **Client Credentials** untuk service-to-service tanpa user, **Password/Direct Access Grant** untuk login langsung username+password (kurang disarankan untuk SPA modern). | `user-management-web` pakai Standard Flow (Authorization Code). `user-management-admin-svc` pakai Client Credentials. |
| **Realm Role** | Label permission yang berlaku lintas semua client dalam satu realm. Cocok untuk permission bisnis global. | `borrower`, `staff`, `branch_manager`, `superadmin`. |
| **Client Role** | Permission yang scope-nya cuma di satu client tertentu (beda dari realm role). Tidak dipakai di project ini, tapi konsepnya penting dibedakan dari realm role. | (tidak dipakai — project ini all-in di realm role). |
| **Group** | Wadah pengelompokan user yang bisa mewarisi role tertentu ke semua anggotanya, dan/atau dipakai murni sebagai label (tanpa role attached) untuk keperluan lain seperti otorisasi custom di aplikasi. | Group `admin`, `visitor` — dipakai project ini sebagai label otorisasi endpoint (`@Groups('admin')`), bukan pewaris role. |
| **User** | Identitas individu di realm: username, email, credential (password), status aktif/nonaktif, serta relasi ke role & group. | 7 user seed: sari, budi, rina, tono, andi, dewi, eko. |
| **Protocol Mapper / Token Claim** | Aturan yang menentukan data apa saja yang dimasukkan ke dalam JWT (mis. `email`, `groups`, `resource_access.<client>.roles`). Menentukan bentuk payload token yang diterima backend. | Payload token dibaca di `jwt.strategy.ts`: `payload.sub`, `payload.email`, `payload.resource_access.account?.roles`, `payload.groups`. |
| **JWKS (JSON Web Key Set)** | Endpoint publik Keycloak yang menyediakan public key untuk verifikasi signature JWT (RS256), tanpa backend perlu tahu private key. | `JWKS_URI=http://localhost:8080/realms/user-management/protocol/openid-connect/certs`. |
| **Admin REST API** | API Keycloak untuk operasi administratif (create/update/delete user, group, role) secara programatik, dipanggil pakai token dari client dengan grant Client Credentials. | Dipakai `KeycloakAdminService` via `@keycloak/keycloak-admin-client`, dan juga dipakai langsung lewat `curl` untuk mengecek state groups/users terkini di laporan ini. |
| **Service Account** | User "virtual" yang otomatis dibuat Keycloak untuk client dengan `serviceAccountsEnabled: true`, dipakai supaya client itu sendiri (bukan user manusia) bisa punya identitas dan role saat memanggil Admin API. | Service account milik `user-management-admin-svc` — ini yang dipakai `ADMIN_CLIENT_ID`/`ADMIN_CLIENT_SECRET`. |
| **Realm Export/Import** | Fitur Keycloak untuk mem-backup seluruh konfigurasi realm (client, role, group, user) ke satu file JSON, agar bisa direplikasi ke environment lain secara konsisten. | `keycloak/realm-export.json` di repo — meski perlu diingat file ini bisa **stale** dibanding kondisi live server jika ada perubahan manual lewat Admin Console/API sesudahnya (seperti yang terjadi pada groups/users di laporan ini). |

## 3. Arsitektur yang Dibangun

Keycloak berperan sebagai satu-satunya sumber kebenaran (source of truth) untuk identitas dan kredensial user. Database aplikasi (PostgreSQL via TypeORM) hanya menyimpan data user sebagai *mirror* (kolom `keycloakId` sebagai penghubung), tidak menyimpan password.

Alur singkat:
1. Client login ke Keycloak, dapat access token (JWT, RS256).
2. Client memanggil API NestJS dengan `Authorization: Bearer <token>`.
3. NestJS memvalidasi token menggunakan public key dari JWKS endpoint Keycloak (tanpa perlu shared secret).
4. Payload token di-decode menjadi `IJwtPayload` (userId, email, roles, groups) dan dipakai untuk otorisasi per-endpoint.

## 4. Komponen yang Dipelajari & Diimplementasikan

### 4.1 Validasi Token — `jwt.strategy.ts`
- Menggunakan `passport-jwt` + `jwks-rsa`.
- `passportJwtSecret` mengambil public key langsung dari `JWKS_URI` Keycloak, dengan cache (5 entries, 10 menit) dan rate limit (10 req/menit) agar tidak membebani Keycloak.
- Validasi `issuer` dan algoritma `RS256`, dengan `clockTolerance: 30` detik untuk toleransi selisih jam server.
- Insight: pendekatan ini menghindari kebutuhan menyimpan secret di aplikasi — cukup percaya ke public key Keycloak yang bisa rotate otomatis.

### 4.2 Guard Berlapis (Global) — `auth.module.ts`
Tiga guard didaftarkan sebagai `APP_GUARD` global, dieksekusi berurutan:
1. `JwtAuthGuard` — memastikan token valid, kecuali endpoint ditandai `@Public()`.
2. `RolesGuard` — mengecek klaim `roles` dari `resource_access.account.roles` (role level client "account" di Keycloak).
3. `GroupsGuard` — mengecek klaim `groups` (group membership di Keycloak), dipakai endpoint user (`@Groups('admin')`).

Insight: role dan group adalah dua konsep berbeda di Keycloak — role untuk permission granular per-client, group untuk pengelompokan user (mis. admin vs visitor) yang bisa mewarisi role. Project ini memilih **group** sebagai basis otorisasi endpoint user, bukan role.

### 4.3 Decorator Metadata
- `@Public()` — bypass JwtAuthGuard (dipakai di endpoint `sync`).
- `@Roles(...)` / `@Groups(...)` — set metadata yang dibaca guard via `Reflector.getAllAndOverride`, sehingga bisa di-override di level method vs controller.

### 4.4 Keycloak Admin Client — `keycloak-admin.service.ts`
- Menggunakan `@keycloak/keycloak-admin-client` dengan grant type `client_credentials` (service account), bukan login user biasa — cocok untuk operasi server-to-server (CRUD user dari backend).
- Autentikasi dilakukan sekali saat `onModuleInit`, client instance di-cache dan di-expose ke module lain via `getClient()`.

### 4.5 Sinkronisasi User (Dual-Write Pattern) — `user.service.ts`
- **Create**: user dibuat dulu di Keycloak, baru disimpan ke DB lokal dengan `keycloakId`. Jika insert DB gagal, user di Keycloak di-rollback (`keycloakClient.users.del`) — pola *compensating transaction* karena Keycloak dan Postgres tidak dalam satu transaksi.
- **Update/Delete**: perubahan diterapkan ke Keycloak dan DB lokal secara berurutan.
- **Sync** (`POST /user/sync`, endpoint `@Public()`): menarik seluruh user dari Keycloak lalu upsert ke DB lokal — berguna untuk migrasi awal atau recovery jika data lokal tidak sinkron.

Insight: karena Keycloak dan DB aplikasi adalah dua sistem terpisah, konsistensi data harus dijaga manual di level aplikasi (bukan otomatis via DB transaction).

### 4.6 Endpoint `/user/me`
Contoh sederhana memanfaatkan `req.user` (hasil decode JWT) tanpa perlu query ulang ke DB — menunjukkan JWT sudah membawa data identitas yang cukup untuk beberapa use case.

## 5. Konfigurasi Server Keycloak (realm `user-management`)

Dikonfirmasi langsung dari instance Keycloak yang berjalan di Docker (`global-keycloak`, image `quay.io/keycloak/keycloak:26.0`, port 8080) dan file referensi `keycloak/realm-export.json`.

### 5.1 Clients
| Client ID | Tipe | Flow | Kegunaan |
|---|---|---|---|
| `user-management-web` | Public | Standard Flow (Authorization Code) | Login user dari frontend (SPA) |
| `user-management-api` | Confidential | — (resource server) | Merepresentasikan API, audience untuk token |
| `user-management-admin-svc` | Confidential, Service Account ON | Client Credentials | Dipakai backend NestJS (`KeycloakAdminService`) untuk CRUD user via Admin API |

Insight: pemisahan 3 client ini adalah praktik standar — client publik (web) tidak pernah pegang secret, client resmi backend (`user-management-admin-svc`) yang pegang secret dan hanya bisa dipakai server-to-server (client_credentials), bukan untuk login user biasa.

Role bersifat **realm role** (bukan client role) sehingga berlaku lintas client, cocok untuk permission bisnis (borrower/staff/manager/superadmin) yang independen dari client mana pun yang dipakai.

### 5.2 Groups
Data live di server (dicek via Admin API) sudah diubah dari struktur cabang menjadi flat, selaras dengan nama yang dipakai di guard kode (`@Groups('admin')`):
```
admin
visitor
```
Insight: ini menutup gap yang sebelumnya tercatat (kode sudah butuh group bernama `admin`, sekarang group tersebut memang ada di realm) — tapi saat ini **belum ada satupun user** yang jadi anggota group `admin` (lihat 4.3), jadi endpoint yang dijaga `@Groups('admin')` (semua endpoint CRUD user selain `/me` dan `/sync`) belum bisa diakses siapa pun sampai ada user di-assign ke group ini.

### 5.3 Users (data live realm saat ini)
| Username | Email | Realm Role | Group | Status |
|---|---|---|---|---|
| sari | sari@smartloan.test | – | admin | aktif |
| budi | budi@smartloan.test | – | visitor | aktif |
| rina | rina@smartloan.test | - | visitor | aktif |
| tono | tono@smartloan.test | - | visitor | aktif |
| andi | andi@smartloan.test | – | visitor | aktif |
| dewi | dewi@smartloan.test | – | visitor | aktif |
| eko | eko@smartloan.test | - | – | aktif (sebelumnya sempat di-disable sebagai contoh, sekarang di-enable kembali) |

### 5.4 Catatan Keamanan dari Observasi Log
Log container `global-keycloak` menunjukkan beberapa percobaan login gagal dari IP publik eksternal (`146.75.46.132`) ke `security-admin-console` dan client `smartloan-admin-svc` dengan `invalid_client_credentials` / `invalid_token`. Ini bukan bagian dari pembelajaran fitur, tapi catatan penting: instance dev ini ter-expose ke internet dan sudah kena percobaan akses tidak sah — perlu dipastikan tidak dipakai di luar environment development, atau ditambah proteksi jaringan (firewall/VPN) sebelum ke tahap lanjut.

## 6. Konfigurasi Environment yang Dibutuhkan

| Variabel | Fungsi |
|---|---|
| `KEYCLOAK_BASE_URL` | URL server Keycloak |
| `KEYCLOAK_REALM` | Nama realm |
| `ADMIN_CLIENT_ID` / `ADMIN_CLIENT_SECRET` | Kredensial service account untuk Admin API |
| `JWKS_URI` | Endpoint public key untuk verifikasi token |
| `JWT_ISSUER` | Validasi klaim `iss` pada token |

Realm reference (`keycloak/realm-export.json`) disertakan di repo untuk mereplikasi konfigurasi realm (client, group, role) secara konsisten antar environment.

## 7. Poin Pembelajaran Utama

1. **Stateless auth**: backend tidak menyimpan session/password, cukup verifikasi JWT dengan public key — scalable dan tidak perlu shared secret antar service.
2. **Pemisahan tanggung jawab**: Keycloak mengurus identitas & kredensial, aplikasi hanya mengurus data profil/relasi bisnis.
3. **Guard global + decorator** adalah pola NestJS yang rapi untuk menerapkan aturan otorisasi yang konsisten di semua endpoint tanpa mengulang kode di tiap controller.
4. **Dual-write butuh strategi kompensasi manual** — tidak ada rollback otomatis lintas sistem, sehingga setiap operasi tulis ke Keycloak + DB harus punya jalur error handling yang membatalkan sisi lain jika salah satu gagal.
5. **Admin API vs User-facing Auth berbeda flow**: login user pakai Authorization Code/Password grant di sisi client, sedangkan backend-ke-Keycloak (untuk CRUD user) pakai `client_credentials` grant.