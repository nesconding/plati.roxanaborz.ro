import { integer } from 'drizzle-orm/pg-core'

import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const first_payment_date_after_deposit_options = business.table(
  'first_payment_date_after_deposit_options',
  {
    ...id,

    value: integer('value').notNull(),

    ...softDeleteTimestamps
  }
)
