import { relations } from 'drizzle-orm'
import { index, integer, numeric, text } from 'drizzle-orm/pg-core'
import { extension_payment_links } from '~/server/database/schema/business/models/extension-payment-links'
import { products_extensions } from '~/server/database/schema/product/models/products-extensions'
import { product } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const products_extensions_installments = product.table(
  'products_extensions_installments',
  {
    ...id,

    count: integer('count').notNull(),
    extensionId: text('product_extension_id')
      .notNull()
      .references(() => products_extensions.id, { onDelete: 'no action' }),

    pricePerInstallment: numeric('price_per_installment').notNull(),

    ...softDeleteTimestamps
  },
  (table) => [
    index('products_extensions_installments_deleted_at_idx').on(table.deletedAt)
  ]
)

export const products_extensions_installments_relations = relations(
  products_extensions_installments,
  ({ one, many }) => ({
    extension: one(products_extensions, {
      fields: [products_extensions_installments.extensionId],
      references: [products_extensions.id]
    }),
    paymentLinks: many(extension_payment_links)
  })
)
