import { relations } from 'drizzle-orm'
import { boolean, index, integer, numeric, text } from 'drizzle-orm/pg-core'
import { extension_payment_links } from '~/server/database/schema/business/models/extension-payment-links'
import { products } from '~/server/database/schema/product/models/products'
import { products_extensions_installments } from '~/server/database/schema/product/models/products-extensions-installments'
import { product } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const products_extensions = product.table(
  'products_extensions',
  {
    ...id,

    extensionMonths: integer('extension_months').notNull(),
    isDepositAmountEnabled: boolean('is_min_deposit_amount_enabled').notNull(),
    minDepositAmount: numeric('min_deposit_amount').notNull(),
    price: numeric('price').notNull(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'no action' }),

    ...softDeleteTimestamps
  },
  (table) => [index('products_extensions_deleted_at_idx').on(table.deletedAt)]
)

export const products_extensions_relations = relations(
  products_extensions,
  ({ one, many }) => ({
    installments: many(products_extensions_installments),
    paymentLinks: many(extension_payment_links),
    product: one(products, {
      fields: [products_extensions.productId],
      references: [products.id]
    })
  })
)
