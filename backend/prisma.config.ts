import 'dotenv/config'
import { defineConfig } from '@prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Temporarily using classic engine to push schema
const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export default defineConfig({
  schema: './prisma/schema.prisma',
  database: {
    url: process.env.DATABASE_URL,
    adapter,
  },
})
