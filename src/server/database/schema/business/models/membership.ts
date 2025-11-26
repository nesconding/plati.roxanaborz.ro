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

  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
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
  productName: text('product_name').notNull(),
  startDate: timestamp('start_date', {
    mode: 'string',
    withTimezone: true
  }).notNull(),
  status: membership_status_type('status').notNull(),

  ...softDeleteTimestamps
})

export const membershipsRelations = relations(memberships, ({ one, many }) => ({
  extensionSubscriptions: many(extension_subscriptions),
  parentOrder: one(product_orders, {
    fields: [memberships.parentOrderId],
    references: [product_orders.id]
  }),
  productSubscriptions: many(product_subscriptions)
}))
