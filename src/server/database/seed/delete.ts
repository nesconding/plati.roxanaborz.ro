import { sql } from 'drizzle-orm'

import { database } from '~/server/database/drizzle'
import * as schemas from '~/server/database/schema'

async function deleteSchemas() {
  console.log('\n🗑️  Deleting all data...\n')

  console.log('\n   Dropping database schemas...')
  await Promise.all([
    await database.execute(sql`DROP SCHEMA IF EXISTS __drizzle CASCADE;`),
    await database.execute(
      sql`DROP SCHEMA IF EXISTS ${schemas.authentication} CASCADE;`
    ),
    await database.execute(
      sql`DROP SCHEMA IF EXISTS ${schemas.business} CASCADE;`
    ),
    await database.execute(
      sql`DROP SCHEMA IF EXISTS ${schemas.product} CASCADE;`
    ),
    await database.execute(
      sql`DROP SCHEMA IF EXISTS ${schemas.calendly} CASCADE;`
    )
  ])

  console.log('   ✅ Database schemas dropped')
  console.log('\n✅ All data deleted successfully\n')
}

deleteSchemas()
