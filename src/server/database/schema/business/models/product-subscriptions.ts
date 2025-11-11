import { relations } from 'drizzle-orm'
import { integer, text, timestamp } from 'drizzle-orm/pg-core'
import { payment_method_type } from '~/server/database/schema/business/enums/payment-method-type'
import { subscription_status_type } from '~/server/database/schema/business/enums/subscription-status-type'
import { memberships } from '~/server/database/schema/business/models/membership'
import { product_orders } from '~/server/database/schema/business/models/product-orders'
import { products } from '~/server/database/schema/product/models/products'
import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const product_subscriptions = business.table('product_subscriptions', {
  ...id,

  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name').notNull(),
  membershipId: text('membership_id')
    .notNull()
    .references(() => memberships.id, { onDelete: 'no action' }),
  nextPaymentDate: timestamp('next_payment_date', {
    mode: 'string',
    withTimezone: true
  }),
  parentOrderId: text('parent_order_id')
    .notNull()
    .references(() => product_orders.id, { onDelete: 'no action' }),
  paymentMethod: payment_method_type('payment_method').notNull(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'no action' }),
  remainingPayments: integer('remaining_payments').notNull(),
  startDate: timestamp('start_date', { mode: 'string', withTimezone: true }),
  status: subscription_status_type('status').notNull(),

  // Token-based security for payment method updates
  updatePaymentToken: text('update_payment_token'), // Secure token for accessing update payment page
  updatePaymentTokenExpiresAt: timestamp('update_payment_token_expires_at', {
    mode: 'string',
    withTimezone: true
  }), // 24-hour expiration

  ...softDeleteTimestamps
})

export const product_subscriptionsRelations = relations(
  product_subscriptions,
  ({ one }) => ({
    membership: one(memberships, {
      fields: [product_subscriptions.membershipId],
      references: [memberships.id]
    }),
    parentOrder: one(product_orders, {
      fields: [product_subscriptions.parentOrderId],
      references: [product_orders.id]
    })
  })
)
