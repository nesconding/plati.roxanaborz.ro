import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '~/server/database/schema'

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}
const client =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL
  })

export const database = drizzle<typeof schema>({ client, schema })
export type Database = typeof database
