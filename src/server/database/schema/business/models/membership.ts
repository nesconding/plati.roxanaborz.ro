import { relations } from 'drizzle-orm'
import { text, timestamp } from 'drizzle-orm/pg-core'

import { membership_status_type } from '~/server/database/schema/business/enums/membership-status-type'
import { extension_subscriptions } from '~/server/database/schema/business/models/extension-subscriptions'
import { product_orders } from '~/server/database/schema/business/models/product-orders'
import { product_subscriptions } from '~/server/database/schema/business/models/product-subscriptions'
import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const memberships = business.table('memberships', {
  ...id,
  delayedStartDate: timestamp('delayed_start_date', {
    mode: 'string',
    withTimezone: true
  }),
  endDate: timestamp('end_date', {
    mode: 'string',
    withTimezone: true
  }).notNull(),

  parentOrderId: text('parent_order_id')
    .notNull()
    .references(() => product_orders.id, { onDelete: 'no action' }),

  startDate: timestamp('start_date', {
    mode: 'string',
    withTimezone: true
  }).notNull(),

  status: membership_status_type('status').notNull(),

  ...softDeleteTimestamps
})

export const membershipsRelations = relations(memberships, ({ one }) => ({
  extensionSubscription: one(extension_subscriptions, {
    fields: [memberships.id],
    references: [extension_subscriptions.membershipId]
  }),
  parentOrder: one(product_orders, {
    fields: [memberships.parentOrderId],
    references: [product_orders.id]
  }),
  productSubscription: one(product_subscriptions, {
    fields: [memberships.id],
    references: [product_subscriptions.membershipId]
  })
}))
