# NIS Gateway - Rencana Implementasi

## Gambaran Umum
NIS Gateway adalah layanan mandiri yang berinteraksi langsung dengan database MySQL sistem lama (monolitik PHP) menggunakan Raw SQL. Tujuan utamanya adalah mereplikasi logika bisnis esensial dari aplikasi lama, sehingga memungkinkan operasi baca/tulis tanpa harus mengubah kode sumber sistem lama.

## Prinsip Desain Utama
- **Non-Invasive:** Tidak ada perubahan pada *source code* sistem lama.
- **Direct Control:** Menggunakan Raw SQL untuk efisiensi dan kendali penuh atas query.
- **Layered Architecture:** Implementasi menggunakan pola **Controller - Service - Repository** untuk pemisahan tanggung jawab yang jelas.

## Arsitektur
- **Bahasa/Runtime:** TypeScript (Bun)
- **Framework:** Hono
- **Akses Database:** Raw SQL menggunakan `Bun.sql` (built-in).
- **Caching:** Valkey (Redis alternative) untuk optimalisasi akses data berulang.
- **Event Messaging:** NATS.io untuk pengiriman dan distribusi *event*.
- **Pola:** 
  - **Controller:** Menangani HTTP Request/Response.
  - **Service:** Menjalankan logika bisnis (meniru aplikasi lama) dan mengirimkan *event* ke NATS.
  - **Repository:** Menangani eksekusi Raw SQL ke database dan interaksi Caching (Valkey).

## Standar Kode & Formatting
- **Linter & Formatter:** Biome
- **Aturan Formatting:**
  - `indentStyle`: space
  - `quoteStyle`: single
  - `semiColons`: asNeeded

## Best Practices & Standardisasi
- **Environment Variables:** Semua konfigurasi sensitif (kredensial DB, URI Valkey, URI NATS, Secret JWT, Port) harus disimpan dalam `.env` dan divalidasi saat aplikasi *startup*.
- **Input Validation:** Menggunakan library validasi skema (seperti Zod atau Hono validator) untuk memastikan integritas payload sebelum masuk ke *service layer*.
- **Centralized Error Handling:** Menangkap semua *exception* melalui middleware khusus agar *response* error konsisten dan aman (tidak membocorkan *stack trace* SQL ke *client*).
- **Structured Logging:** Melakukan *logging* (JSON format) untuk setiap *request* yang masuk, *query* penting, dan pengiriman *event*.
- **Graceful Shutdown:** Menangani *signal* terminasi sistem (SIGINT/SIGTERM) untuk menutup koneksi database, *cache* (Valkey), dan koneksi *messaging* (NATS) secara aman sebelum aplikasi mati.

## Tahapan Implementasi

### Fase 1: Audit & Fondasi
- [x] Konfigurasi lingkungan dan folder struktur (Controller, Service, Repository).
- [x] Pemetaan tabel krusial dan relasinya (Bandwidth, Customer, Subscriber).
- [x] Setup `Bun.sql` untuk koneksi database.

### Fase 2: Pengembangan Layanan (Service Development)
- [x] Implementasi endpoint `POST /auth/token` untuk menghasilkan JWT.
- [x] Implementasi endpoint `POST /bandwidth/search` untuk melihat informasi bandwidth.
- [x] Implementasi endpoint `GET /customer/search` untuk mencari Customer ID.
- [x] Implementasi endpoint `GET /subscriber/search`, `POST /subscriber/sync-graphs`, dan `GET /subscriber/fttx-circuits`.
- [x] Integrasi OpenAPI (Swagger UI) untuk dokumentasi otomatis.
- [x] Implementasi *Repository layer* untuk eksekusi Raw SQL.
- [x] Implementasi *Service layer* untuk logika bisnis inti.
- [x] Pembuatan *Controller layer* dengan Hono.

### Fase 3: Validasi & Deployment
- [ ] Pengembangan pengujian unit/integrasi.
- [ ] Peluncuran dan rilis modul secara bertahap.

## Keamanan
- Gunakan user MySQL khusus dengan hak akses terbatas (`GRANT`).
- Implementasikan autentikasi berbasis JWT untuk *bridge*.
- Terapkan *rate limiting* untuk mencegah beban berlebih pada database sistem lama.
