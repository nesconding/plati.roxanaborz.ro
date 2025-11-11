import { numeric, text } from 'drizzle-orm/pg-core'

import { payment_currency_type } from '~/server/database/schema/business/enums/payment-currency-type'

import { business } from '~/server/database/schema/schemas'
import { id, softDeleteTimestamps } from '~/server/database/schema/utils'

export const payments_settings = business.table('payments_settings', {
  ...id,

  currency: payment_currency_type('currency').notNull(),
  extraTaxRate: numeric('extra_tax_rate').notNull(),
  label: text('label').notNull(),
  tvaRate: numeric('tva_rate').notNull(),

  ...softDeleteTimestamps
})
