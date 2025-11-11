import { createId } from '@paralleldrive/cuid2'
import { text, timestamp } from 'drizzle-orm/pg-core'

export const id = {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId())
}

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString())
}

export const softDeleteTimestamps = {
  ...timestamps,
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' })
}
