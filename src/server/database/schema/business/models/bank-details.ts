import { sql } from 'drizzle-orm'
import { check, integer, jsonb, text } from 'drizzle-orm/pg-core'
import type { AddressFormValues } from '~/client/modules/checkout/checkout-form/schema'
import { business } from '~/server/database/schema/schemas'
import { timestamps } from '~/server/database/schema/utils'

export const bank_details = business.table(
  'bank_details',
  {
    address: jsonb('address').$type<AddressFormValues>(),
    bank: text('bank').notNull(),
    bic: text('bic').notNull(),
    cui: text('cui').notNull(),
    iban: text('bank_account').notNull(),
    id: integer('id').primaryKey().notNull().default(1),
    name: text('name').notNull(),
    registrationNumber: text('registration_number').notNull(),
    representativeLegal: text('representative_legal').notNull(),

    ...timestamps
  },
  (table) => [check('check_bank_details_id', sql`${table.id} = 1`)]
)
