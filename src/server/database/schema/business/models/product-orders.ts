import { relations } from 'drizzle-orm'
import { text } from 'drizzle-orm/pg-core'
import { order_status_type } from '~/server/database/schema/business/enums/order-status-type'
import { order_type } from '~/server/database/schema/business/enums/order-type'
import { memberships } from '~/server/database/schema/business/models/membership'
import { product_payment_links } from '~/server/database/schema/business/models/product-payment-links'
import { product_subscriptions } from '~/server/database/schema/business/models/product-subscriptions'
import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const product_orders = business.table('product_orders', {
  ...id,

  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  productName: text('product_name').notNull(),
  productPaymentLinkId: text('product_payment_link_id')
    .notNull()
    .references(() => product_payment_links.id, { onDelete: 'no action' }),
  status: order_status_type('status').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
  type: order_type('type').notNull(),

  ...softDeleteTimestamps
})

export const product_ordersRelations = relations(product_orders, ({ one }) => ({
  membershipParentOrder: one(memberships, {
    fields: [product_orders.id],
    references: [memberships.parentOrderId]
  }),
  productPaymentLink: one(product_payment_links, {
    fields: [product_orders.productPaymentLinkId],
    references: [product_payment_links.id]
  }),
  subscriptionParentOrder: one(product_subscriptions, {
    fields: [product_orders.id],
    references: [product_subscriptions.parentOrderId]
  })
}))
