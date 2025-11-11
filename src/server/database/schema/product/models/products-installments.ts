import { relations } from 'drizzle-orm'
import { index, integer, numeric, text } from 'drizzle-orm/pg-core'
import { product_payment_links } from '~/server/database/schema/business/models/product-payment-links'
import { products } from '~/server/database/schema/product/models/products'
import { product } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const products_installments = product.table(
  'products_installments',
  {
    ...id,

    count: integer('count').notNull(),
    pricePerInstallment: numeric('price_per_installment').notNull(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'no action' }),

    ...softDeleteTimestamps
  },
  (table) => [index('products_installments_deleted_at_idx').on(table.deletedAt)]
)

export const products_installments_relations = relations(
  products_installments,
  ({ one, many }) => ({
    paymentLinks: many(product_payment_links),
    product: one(products, {
      fields: [products_installments.productId],
      references: [products.id]
    })
  })
)
