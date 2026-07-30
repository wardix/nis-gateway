# NIS Gateway - Guide

Project ini menggunakan Bun + Hono dengan arsitektur berlapis (layered architecture).

## Commands
- Run: `bun run start` (Production)
- Run: `bun run dev` (Development with watch mode)
- Format & Lint: `bun run format` (Biome)
- Build: Tidak diperlukan (Runtime TS native Bun)

> **Catatan:** Testing belum diterapkan pada proyek ini.

## Project Structure
- `src/index.ts`: Entry point (Hono app instance)
- `src/controllers/`: Route handlers menggunakan `@hono/zod-openapi`
- `src/services/`: Logic bisnis & orchestrasi repository
- `src/repositories/`: Database access menggunakan Raw SQL (`Bun.sql`)
- `src/config/`: Configuration (Env validation via Zod, DB connection)

> **Catatan:** Variabel lingkungan `NATS_URI` dan `VALKEY_URI` sudah didefinisikan di env.ts untuk kebutuhan integrasi masa depan. Di package.json terdapat dependencies `nats` dan `ioredis`, namun saat ini belum ada implementasi aktif NATS messaging atau Valkey caching.

## Coding Standards
- **Linter & Formatter:** Biome (Indent: 2 spaces, Quote: single, Semi: as-needed)
- **API Documentation:** Wajib menggunakan `@hono/zod-openapi` untuk setiap endpoint baru agar Swagger UI tetap sinkron.
- **Database:** Gunakan Raw SQL via `Bun.sql`. Jangan gunakan ORM.
- **Security:**
  - `/auth/token`: Gunakan `STATIC_AUTH_TOKEN` via `bearerAuth`.
  - Business endpoints: Gunakan `JWT_SECRET` via middleware `jwt`.

## API Documentation
- Swagger UI: `http://localhost:3000/ui`
- OpenAPI Doc: `http://localhost:3000/doc`
