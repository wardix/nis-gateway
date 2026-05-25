# NIS Gateway

NIS Gateway adalah layanan API modern (Shadow API Bridge) yang dibangun menggunakan **Bun** dan **Hono**. Proyek ini berfungsi sebagai jembatan untuk mengakses dan mengelola data pada sistem monolitik PHP lama secara aman tanpa mengubah kode sumber sistem tersebut.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** [Hono](https://hono.dev)
- **Database:** Native `Bun.sql` (MySQL) - Akses Raw SQL
- **Caching:** Valkey (Redis-compatible) via `ioredis`
- **Messaging:** [NATS.io](https://nats.io)
- **Documentation:** OpenAPI 3.0 via Swagger UI
- **Tooling:** Biome (Linting & Formatting)

## Arsitektur

Proyek ini menggunakan **Layered Architecture**:
- **Controllers:** Menangani request/response HTTP dan validasi input (Zod).
- **Services:** Berisi logika bisnis utama dan integrasi eksternal (NATS/Valkey).
- **Repositories:** Berisi query Raw SQL untuk berinteraksi langsung dengan database legacy.
- **Config:** Pengaturan environment dan inisialisasi koneksi database/cache.

## Fitur Utama

1. **Authentication & Security:** 
   - **Layer 1:** Endpoint `POST /auth/token` dilindungi oleh **Static Bearer Token** (untuk manajemen akses aplikasi).
   - **Layer 2:** Endpoint bisnis (`/bandwidth`, `/customer`, `/subscriber`) dilindungi oleh **JWT Bearer Token** yang dihasilkan dari Layer 1.
2. **Bandwidth:** 
   - Lookup bandwidth berdasarkan array IP (mendukung batching).
3. **Customer:**
   - Pencarian Customer ID berdasarkan email (multi-column search).
4. **Subscriber:**
   - Lookup subscriber berdasarkan nomor telepon.
   - Sinkronisasi batch data grafik (Zabbix).
   - Data sirkuit FTTX dengan paginasi.

## Persiapan & Instalasi

1. **Clone & Install:**
   ```bash
   bun install
   ```
2. **Environment:**
   Salin `.env.example` menjadi `.env` dan sesuaikan nilainya.
   ```bash
   cp .env.example .env
   ```
3. **Running:**
   ```bash
   # Mode Produksi
   bun run start

   # Mode Pengembangan (dengan watch mode)
   bun run dev
   ```

## Dokumentasi API (Swagger)

Aplikasi ini menyediakan dokumentasi interaktif yang dapat diakses saat aplikasi berjalan:
- **Swagger UI:** `http://localhost:3000/ui`
- **OpenAPI Spec (JSON):** `http://localhost:3000/doc`

## Standar Kode

- **Formatting:** Menggunakan Biome (Indent: space, Quote: single, Semicolon: as-needed).
- **Validasi:** Menggunakan Zod untuk memastikan keamanan data masuk.
- **Raw SQL:** Tidak menggunakan ORM untuk performa maksimal dan kendali penuh atas query legacy.
