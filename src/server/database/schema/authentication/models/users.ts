import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  text,
  timestamp,
  uniqueIndex
} from 'drizzle-orm/pg-core'

import { user_roles } from '~/server/database/schema/authentication/enums/user-roles'
import { users_accounts } from '~/server/database/schema/authentication/models/users-accounts'
import { users_sessions } from '~/server/database/schema/authentication/models/users-sessions'
import { extension_orders } from '~/server/database/schema/business/models/extension-orders'
import { extension_payment_links } from '~/server/database/schema/business/models/extension-payment-links'
import { product_orders } from '~/server/database/schema/business/models/product-orders'
import { product_payment_links } from '~/server/database/schema/business/models/product-payment-links'
import { authentication } from '~/server/database/schema/schemas'
import { id, timestamps } from '~/server/database/schema/utils'
import { UserRoles } from '~/shared/enums/user-roles'

export const users = authentication.table(
  'users',
  {
    ...id,
    banExpires: timestamp('ban_expires', {
      mode: 'string',
      withTimezone: true
    }),
    banned: boolean('banned').default(false),
    banReason: text('ban_reason'),

    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    firstName: text('first_name').notNull(),
    image: text('image'),

    invitedById: text('invited_by_id'),
    lastName: text('last_name').notNull(),
    name: text('name').notNull(),
    phoneNumber: text('phone_number'),
    phoneNumberVerified: boolean('phone_number_verified').default(false),
    role: user_roles('role').notNull().default(UserRoles.USER),

    ...timestamps
  },
  (table) => [
    check(
      'check_super_admins_not_banned',
      sql`${table.role} != ${sql.raw(`'${UserRoles.SUPER_ADMIN}'`)} OR (${table.banned} = false AND ${table.banExpires} IS NULL AND ${table.banReason} IS NULL)`
    ),
    uniqueIndex('one_super_admin_idx')
      .on(table.role)
      .where(sql`${table.role} = ${sql.raw(`'${UserRoles.SUPER_ADMIN}'`)}`),
    uniqueIndex('unique_phone_number_idx')
      .on(table.phoneNumber)
      .where(sql`${table.phoneNumber} IS NOT NULL`)
  ]
)

export const users_relations = relations(users, ({ one, many }) => ({
  accounts: many(users_accounts),
  extensionOrders: many(extension_orders),
  extensionPaymentLinks: many(extension_payment_links),
  invitedBy: one(users, {
    fields: [users.invitedById],
    references: [users.id],
    relationName: 'invitedBy'
  }),
  productOrders: many(product_orders),
  productPaymentLinks: many(product_payment_links),
  sessions: many(users_sessions)
}))
