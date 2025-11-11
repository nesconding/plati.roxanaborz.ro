import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  numeric,
  text,
  uniqueIndex
} from 'drizzle-orm/pg-core'

import { product_payment_links } from '~/server/database/schema/business/models/product-payment-links'
import { products_extensions } from '~/server/database/schema/product/models/products-extensions'
import { products_installments } from '~/server/database/schema/product/models/products-installments'
import { product } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const products = product.table(
  'products',
  {
    ...id,

    isDepositAmountEnabled: boolean('is_min_deposit_amount_enabled').notNull(),
    membershipDurationMonths: integer('membership_duration_months').notNull(),
    minDepositAmount: numeric('min_deposit_amount').notNull(),
    name: text('name').notNull(),
    price: numeric('price').notNull(),

    ...softDeleteTimestamps
  },
  (table) => [
    index('products_deleted_at_idx').on(table.deletedAt),
    uniqueIndex('products_name_deleted_at_unique').on(
      table.name,
      table.deletedAt
    )
  ]
)

export const productsRelations = relations(products, ({ many }) => ({
  extensions: many(products_extensions),
  installments: many(products_installments),
  paymentLinks: many(product_payment_links)
}))
