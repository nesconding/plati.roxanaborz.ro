import { relations } from 'drizzle-orm'
import { index, text, timestamp } from 'drizzle-orm/pg-core'

import { users } from '~/server/database/schema/authentication/models/users'
import { authentication } from '~/server/database/schema/schemas'
import { id, timestamps } from '~/server/database/schema/utils'

export const users_accounts = authentication.table(
  'users_accounts',
  {
    ...id,

    accessToken: text('access_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
      mode: 'string'
    }),
    accountId: text('account_id').notNull(),
    idToken: text('id_token'),
    password: text('password'),
    providerId: text('provider_id').notNull(),
    refreshToken: text('refresh_token'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
      mode: 'string'
    }),
    scope: text('scope'),
    impersonatedBy: text('impersonated_by'),

    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    ...timestamps
  },
  (table) => [index('users_account_user_id_idx').on(table.userId)]
)

export const users_accounts_relations = relations(
  users_accounts,
  ({ one }) => ({
    user: one(users, {
      fields: [users_accounts.userId],
      references: [users.id]
    })
  })
)
