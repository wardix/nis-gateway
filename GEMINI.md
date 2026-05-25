# NIS Gateway - Project Instructions & Mandates

Dokumen ini berisi instruksi khusus, konvensi, dan workflow yang wajib diikuti oleh agen AI saat bekerja pada proyek NIS Gateway.

## Struktur Proyek

- `src/index.ts`: Entry point aplikasi.
- `src/controllers/`: Folder untuk handler HTTP/API.
- `src/services/`: Folder untuk logika bisnis.
- `src/repositories/`: Folder untuk query database (Raw SQL).
- `src/config/`: Folder untuk konfigurasi (env, database connection, dll).

## Arsitektur & Pola Desain

- **Layered Architecture:** Selalu gunakan pola **Controller - Service - Repository**.
  - **Controller:** Wajib menggunakan `@hono/zod-openapi` dan `createRoute` untuk mendefinisikan endpoint agar dokumentasi otomatis tetap sinkron.
  - **Service:** Tempat logika bisnis dan orkestrasi antar repository atau layanan eksternal (NATS/Valkey).
  - **Repository:** Tempat eksklusif untuk eksekusi query ke database.
- **Raw SQL Only:** DILARANG menggunakan ORM (seperti Prisma/Drizzle). Gunakan fitur native `Bun.sql` untuk menulis query MySQL secara eksplisit.
- **Dependency Injection:** Masukkan Repository ke dalam Service via constructor untuk mempermudah pengujian.

## Standar Kode & Formatting

- **Biome:** Gunakan Biome untuk linting dan formatting.
  - `indentStyle`: space (2 spaces)
  - `quoteStyle`: single
  - `semicolons`: as-needed
- **Strict Typing:** Selalu definisikan `interface` untuk hasil query database dan payload API di file yang relevan.

## Keamanan & Environment

- **Environment Validation:** Semua variabel baru di `.env` harus didaftarkan dan divalidasi di `src/config/env.ts`.
- **Two-Layer Security:**
  - **Static Auth:** Endpoint `POST /auth/token` wajib menggunakan `bearerAuth` dengan `STATIC_AUTH_TOKEN`.
  - **JWT Auth:** Semua endpoint bisnis (`/bandwidth`, `/customer`, `/subscriber`) wajib dilindungi menggunakan middleware `jwt` dengan `JWT_SECRET`.
- **Non-Invasive:** Jangan pernah membuat perubahan yang mengubah skema database legacy atau memicu logika di kode PHP legacy kecuali diminta secara eksplisit.

## Workflow Pengembangan

1. **Audit Query:** Sebelum mengimplementasikan fitur baru, audit query SQL dari sistem lama jika tersedia.
2. **Batching:** Gunakan pola *batching* (misal: 500 records) saat menjalankan query `IN` pada kumpulan data yang besar untuk menjaga stabilitas database.
3. **Error Handling:** Gunakan `try-catch` di tingkat Repository dan Controller dengan pesan error yang aman bagi pengguna.
