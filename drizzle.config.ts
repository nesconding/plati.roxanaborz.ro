import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  dialect: 'postgresql',
  migrations: { schema: '__drizzle' },
  out: './src/server/database/drizzle',
  schema: './src/server/database/schema/index.ts'
})
