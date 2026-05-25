import { SQL } from 'bun'
import { env } from './env'

// Bun v1.2.21+ supports native MySQL via Bun.sql
// We use the DB_URL from environment variables
export const sql = new SQL(env.DB_URL)
