import 'dotenv/config'
import { defineConfig } from '@prisma/config'

// Temporarily using classic engine to push schema
export default defineConfig({
  schema: './prisma/schema.prisma',
})
