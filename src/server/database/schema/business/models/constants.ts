import { sql } from 'drizzle-orm'
import { check, integer, numeric } from 'drizzle-orm/pg-core'

import { business } from '~/server/database/schema/schemas'
import { timestamps } from '~/server/database/schema/utils'

export const constants = business.table(
  'constants',
  {
    eurToRonRate: numeric('eur_to_ron_rate').notNull(),
    id: integer('id').primaryKey().notNull().default(1),

    ...timestamps
  },
  (table) => [check('check_constants_id', sql`${table.id} = 1`)]
)
