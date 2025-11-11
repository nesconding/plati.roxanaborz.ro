import { text, timestamp } from 'drizzle-orm/pg-core'

import { authentication } from '~/server/database/schema/schemas'
import { id, timestamps } from '~/server/database/schema/utils'

export const verifications = authentication.table('verifications', {
  ...id,

  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date'
  }).notNull(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),

  ...timestamps
})
