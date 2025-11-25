import { relations } from 'drizzle-orm'
import { jsonb, text } from 'drizzle-orm/pg-core'

import { order_status_type } from '~/server/database/schema/business/enums/order-status-type'
import { order_type } from '~/server/database/schema/business/enums/order-type'
import { payment_product_type } from '~/server/database/schema/business/enums/payment-product-type'
import { extension_payment_links } from '~/server/database/schema/business/models/extension-payment-links'
import { extension_subscriptions } from '~/server/database/schema/business/models/extension-subscriptions'
import { memberships } from '~/server/database/schema/business/models/membership'
import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

export const extension_orders = business.table('extension_orders', {
  ...id,

  billingData: jsonb('billing_data'),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  extensionPaymentLinkId: text('extension_payment_link_id')
    .notNull()
    .references(() => extension_payment_links.id, { onDelete: 'no action' }),
  membershipId: text('membership_id')
    .notNull()
    .references(() => memberships.id, { onDelete: 'no action' }),
  paymentProductType: payment_product_type('payment_product_type')
    .default(PaymentProductType.Extension)
    .notNull(),
  productName: text('product_name').notNull(),
  status: order_status_type('status').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
  type: order_type('type').notNull(),

  ...softDeleteTimestamps
})

export const extension_ordersRelations = relations(
  extension_orders,
  ({ one }) => ({
    extensionPaymentLink: one(extension_payment_links, {
      fields: [extension_orders.extensionPaymentLinkId],
      references: [extension_payment_links.id]
    }),
    extensionSubscriptionParentOrder: one(extension_subscriptions, {
      fields: [extension_orders.id],
      references: [extension_subscriptions.parentOrderId]
    }),
    membership: one(memberships, {
      fields: [extension_orders.membershipId],
      references: [memberships.id]
    })
  })
)
