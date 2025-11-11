import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './src/server/database/drizzle',
  schema: './src/server/database/schema/index.ts',
  dialect: 'postgresql',

  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  migrations: { schema: '__drizzle' }
})
