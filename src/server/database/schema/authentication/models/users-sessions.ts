import { relations } from 'drizzle-orm'
import { index, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from '~/server/database/schema/authentication/models/users'
import { authentication } from '~/server/database/schema/schemas'
import { id, timestamps } from '~/server/database/schema/utils'

export const users_sessions = authentication.table(
  'users_sessions',
  {
    ...id,

    expiresAt: timestamp('expires_at', {
      mode: 'date',
      withTimezone: true
    }).notNull(),
    ipAddress: text('ip_address'),
    token: text('token').notNull().unique(),
    userAgent: text('user_agent'),

    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    ...timestamps
  },
  (table) => [index('users_session_user_id_idx').on(table.userId)]
)

export const users_sessions_relations = relations(
  users_sessions,
  ({ one }) => ({
    user: one(users, {
      fields: [users_sessions.userId],
      references: [users.id]
    })
  })
)
