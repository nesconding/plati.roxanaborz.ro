import { relations } from 'drizzle-orm'
import { integer, text, timestamp } from 'drizzle-orm/pg-core'
import { payment_method_type } from '~/server/database/schema/business/enums/payment-method-type'
import { subscription_status_type } from '~/server/database/schema/business/enums/subscription-status-type'
import { extension_orders } from '~/server/database/schema/business/models/extension-orders'
import { memberships } from '~/server/database/schema/business/models/membership'
import { products_extensions } from '~/server/database/schema/product/models/products-extensions'
import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const extension_subscriptions = business.table(
  'extension_subscriptions',
  {
    ...id,

    customerEmail: text('customer_email').notNull(),
    customerName: text('customer_name'),
    extensionId: text('extension_id')
      .notNull()
      .references(() => products_extensions.id, { onDelete: 'no action' }),

    membershipId: text('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'no action' }),
    nextPaymentDate: timestamp('next_payment_date', {
      mode: 'string',
      withTimezone: true
    }),
    parentOrderId: text('parent_order_id')
      .notNull()
      .references(() => extension_orders.id, { onDelete: 'no action' }),
    paymentMethod: payment_method_type('payment_method').notNull(),
    productName: text('product_name').notNull(),
    remainingPayments: integer('remaining_payments').notNull(),
    startDate: timestamp('start_date', { mode: 'string', withTimezone: true }),
    status: subscription_status_type('status').notNull(),

    // Added for payment flow implementation
    stripeSubscriptionId: text('stripe_subscription_id'), // Stripe Subscription ID (moved from payments table)
    stripeSubscriptionScheduleId: text('stripe_subscription_schedule_id'), // Stripe Subscription Schedule ID for installments

    // Token-based security for payment method updates
    updatePaymentToken: text('update_payment_token'), // Secure token for accessing update payment page
    updatePaymentTokenExpiresAt: timestamp('update_payment_token_expires_at', {
      mode: 'string',
      withTimezone: true
    }), // 24-hour expiration

    ...softDeleteTimestamps
  }
)

export const extension_subscriptionsRelations = relations(
  extension_subscriptions,
  ({ one }) => ({
    membership: one(memberships, {
      fields: [extension_subscriptions.membershipId],
      references: [memberships.id]
    }),
    parentOrder: one(extension_orders, {
      fields: [extension_subscriptions.parentOrderId],
      references: [extension_orders.id]
    })
  })
)
