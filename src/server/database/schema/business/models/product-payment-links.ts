import { relations } from 'drizzle-orm'
import { integer, numeric, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from '~/server/database/schema/authentication/models/users'
import { payment_currency_type } from '~/server/database/schema/business/enums/payment-currency-type'
import { payment_link_type } from '~/server/database/schema/business/enums/payment-link-type'
import { payment_method_type } from '~/server/database/schema/business/enums/payment-method-type'
import { payment_product_type } from '~/server/database/schema/business/enums/payment-product-type'
import { payment_status_type } from '~/server/database/schema/business/enums/payment-status-type'
import { contracts } from '~/server/database/schema/business/models/contracts'
import { product_orders } from '~/server/database/schema/business/models/product-orders'
import { product_subscriptions } from '~/server/database/schema/business/models/product-subscriptions'
import { products } from '~/server/database/schema/product/models/products'
import { products_installments } from '~/server/database/schema/product/models/products-installments'
import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

export const product_payment_links = business.table('product_payment_links', {
  ...id,
  callerName: text('caller_name'),
  contractId: text('contract_id')
    .notNull()
    .references(() => contracts.id, { onDelete: 'no action' }),
  createdById: text('created_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'no action' }),
  currency: payment_currency_type('currency').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  depositAmount: numeric('deposit_amount'),
  depositAmountInCents: numeric('deposit_amount_in_cents'),
  eurToRonRate: numeric('eur_to_ron_rate'),
  expiresAt: timestamp('expires_at', {
    mode: 'string',
    withTimezone: true
  }).notNull(),
  extraTaxRate: integer('extra_tax_rate').notNull(),
  firstPaymentDateAfterDeposit: timestamp('first_payment_date_after_deposit', {
    mode: 'string',
    withTimezone: true
  }),
  paymentMethodType: payment_method_type('payment_method_type').notNull(),
  paymentProductType: payment_product_type('payment_product_type')
    .default(PaymentProductType.Product)
    .notNull(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'no action' }),
  productInstallmentAmountToPay: numeric('installment_amount_to_pay'),
  productInstallmentAmountToPayInCents: numeric(
    'installment_amount_to_pay_in_cents'
  ),
  productInstallmentId: text('product_installment_id').references(
    () => products_installments.id,
    { onDelete: 'no action' }
  ),
  productInstallmentsCount: integer('product_installments_count'),
  productName: text('product_name').notNull(),
  remainingAmountToPay: numeric('remaining_amount_to_pay'),
  remainingAmountToPayInCents: numeric('remaining_amount_to_pay_in_cents'),
  remainingInstallmentAmountToPay: numeric(
    'remaining_installment_amount_to_pay'
  ),
  remainingInstallmentAmountToPayInCents: numeric(
    'remaining_installment_amount_to_pay_in_cents'
  ),
  setterName: text('setter_name'),
  status: payment_status_type('status').notNull(),
  stripeClientSecret: text('stripe_client_secret').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
  totalAmountToPay: numeric('total_amount_to_pay').notNull(),
  totalAmountToPayInCents: numeric('total_amount_to_pay_in_cents').notNull(),
  tvaRate: numeric('tva_rate').notNull(),
  type: payment_link_type('type').notNull(),

  ...softDeleteTimestamps
})

export const product_payment_linksRelations = relations(
  product_payment_links,
  ({ one, many }) => ({
    contract: one(contracts, {
      fields: [product_payment_links.contractId],
      references: [contracts.id]
    }),
    createdBy: one(users, {
      fields: [product_payment_links.createdById],
      references: [users.id]
    }),
    product: one(products, {
      fields: [product_payment_links.productId],
      references: [products.id]
    }),
    productInstallment: one(products_installments, {
      fields: [product_payment_links.productInstallmentId],
      references: [products_installments.id]
    }),
    productOrder: one(product_orders, {
      fields: [product_payment_links.id],
      references: [product_orders.productPaymentLinkId]
    }),
    productSubscriptions: many(product_subscriptions)
  })
)
