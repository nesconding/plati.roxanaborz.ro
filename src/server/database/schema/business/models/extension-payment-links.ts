import { relations } from 'drizzle-orm'
import { integer, numeric, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from '~/server/database/schema/authentication/models/users'
import { payment_currency_type } from '~/server/database/schema/business/enums/payment-currency-type'
import { payment_link_type } from '~/server/database/schema/business/enums/payment-link-type'
import { payment_method_type } from '~/server/database/schema/business/enums/payment-method-type'
import { payment_product_type } from '~/server/database/schema/business/enums/payment-product-type'
import { payment_status_type } from '~/server/database/schema/business/enums/payment-status-type'
import { extension_orders } from '~/server/database/schema/business/models/extension-orders'
import { extension_subscriptions } from '~/server/database/schema/business/models/extension-subscriptions'
import { memberships } from '~/server/database/schema/business/models/membership'
import { products_extensions } from '~/server/database/schema/product/models/products-extensions'
import { products_extensions_installments } from '~/server/database/schema/product/models/products-extensions-installments'
import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const extension_payment_links = business.table(
  'extension_payment_links',
  {
    ...id,
    createdById: text('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'no action' }),
    currency: payment_currency_type('currency').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerName: text('customer_name').notNull(),
    depositAmount: numeric('deposit_amount'),
    depositAmountInCents: numeric('deposit_amount_in_cents'),
    eurToRonRate: numeric('eur_to_ron_rate'),
    expiresAt: timestamp('expires_at', {
      mode: 'string',
      withTimezone: true
    }).notNull(),
    extensionId: text('extension_id')
      .notNull()
      .references(() => products_extensions.id, { onDelete: 'no action' }),
    extensionInstallmentAmountToPay: numeric(
      'extension_installment_amount_to_pay'
    ),
    extensionInstallmentAmountToPayInCents: numeric(
      'extension_installment_amount_to_pay_in_cents'
    ),
    extensionInstallmentId: text('extension_installment_id').references(
      () => products_extensions_installments.id,
      {
        onDelete: 'no action'
      }
    ),
    extensionInstallmentsCount: integer('extension_installments_count'),
    extraTaxRate: integer('extra_tax_rate').notNull(),
    firstPaymentDateAfterDeposit: timestamp(
      'first_payment_date_after_deposit',
      {
        mode: 'string',
        withTimezone: true
      }
    ),
    membershipId: text('membership_id')
      .notNull()
      .references(() => memberships.id, {
        onDelete: 'no action'
      }),
    paymentMethodType: payment_method_type('payment_method_type').notNull(),
    paymentProductType: payment_product_type('payment_product_type').notNull(),
    productName: text('product_name').notNull(),
    remainingAmountToPay: numeric('remaining_amount_to_pay'),
    remainingAmountToPayInCents: numeric('remaining_amount_to_pay_in_cents'),
    remainingInstallmentAmountToPay: numeric(
      'remaining_installment_amount_to_pay'
    ),
    remainingInstallmentAmountToPayInCents: numeric(
      'remaining_installment_amount_to_pay_in_cents'
    ),
    status: payment_status_type('status').notNull(),
    stripeClientSecret: text('stripe_client_secret').notNull(),
    stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
    totalAmountToPay: numeric('total_amount_to_pay').notNull(),
    totalAmountToPayInCents: numeric('total_amount_to_pay_in_cents').notNull(),
    tvaRate: numeric('tva_rate').notNull(),
    type: payment_link_type('type').notNull(),
    ...softDeleteTimestamps
  }
)

export const extension_payment_linksRelations = relations(
  extension_payment_links,
  ({ one, many }) => ({
    createdBy: one(users, {
      fields: [extension_payment_links.createdById],
      references: [users.id]
    }),
    extension: one(products_extensions, {
      fields: [extension_payment_links.extensionId],
      references: [products_extensions.id]
    }),
    extensionInstallment: one(products_extensions_installments, {
      fields: [extension_payment_links.extensionInstallmentId],
      references: [products_extensions_installments.id]
    }),
    extensionOrders: one(extension_orders, {
      fields: [extension_payment_links.id],
      references: [extension_orders.extensionPaymentLinkId]
    }),
    extensionSubscriptions: many(extension_subscriptions),
    membership: one(memberships, {
      fields: [extension_payment_links.membershipId],
      references: [memberships.id]
    })
  })
)
