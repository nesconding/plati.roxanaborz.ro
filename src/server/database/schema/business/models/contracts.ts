import { relations } from 'drizzle-orm'
import { index, jsonb, text } from 'drizzle-orm/pg-core'

import { product_payment_links } from '~/server/database/schema/business/models/product-payment-links'
import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const contracts = business.table(
  'contracts',
  {
    ...id,
    fields: jsonb('fields')
      .$type<
        {
          formFieldName: string
          pdfFieldName: string
        }[]
      >()
      .notNull(),

    name: text('name').notNull(),
    pathname: text('pathname').notNull().unique(),

    ...softDeleteTimestamps
  },
  (table) => [index('contracts_deleted_at_idx').on(table.deletedAt)]
)

export const contractsRelations = relations(contracts, ({ many }) => ({
  productPaymentLinks: many(product_payment_links)
}))
