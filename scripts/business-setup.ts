import { createId } from '@paralleldrive/cuid2'
import { getTableUniqueName } from 'drizzle-orm'
import { database } from '~/server/database/drizzle'
import * as schema from '~/server/database/schema'
import type { bank_details } from '~/server/database/schema/business/models/bank-details'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'

const CONSTANTS = [{ eurToRonRate: '5.05' }]
const DEPOSIT_FIRST_PAYMENT_DATE_OPTIONS = [
  { value: 2 },
  { value: 10 },
  { value: 14 },
  { value: 15 },
  { value: 30 }
]
const PAYMENTS_SETTINGS = [
  {
    currency: PaymentCurrencyType.EUR,
    extraTaxRate: '0',
    label: 'Olanda',
    tvaRate: '21'
  },
  {
    currency: PaymentCurrencyType.RON,
    extraTaxRate: '21',
    label: 'Republica Moldova',
    tvaRate: '0'
  },
  {
    currency: PaymentCurrencyType.RON,
    extraTaxRate: '0',
    isDefault: true,
    label: 'România',
    tvaRate: '21'
  },
  {
    currency: PaymentCurrencyType.EUR,
    extraTaxRate: '0',
    label: 'Cipru',
    tvaRate: '0'
  }
]

const BANK_DETAILS = {
  address: {
    apartment: '',
    building: '',
    city: '',
    country: '',
    county: '',
    entrance: '',
    floor: '',
    postalCode: '',
    street: '',
    streetNumber: ''
  },
  bank: '',
  bic: '',
  cui: '',
  iban: '',
  registrationNumber: '',
  representativeLegal: ''
}

export const HARDCODED_PRODUCTS = [
  {
    extensions: [
      {
        extensionMonths: 1,
        minDepositAmount: '100',
        price: '537'
      },
      {
        extensionMonths: 3,
        minDepositAmount: '300',
        price: '1570'
      },
      {
        extensionMonths: 6,
        installments: [{ count: 2, pricePerInstallment: '1676' }],
        minDepositAmount: '500',
        price: '3048'
      }
    ],
    installments: [
      { count: 2, pricePerInstallment: '2095.2380952381' },
      { count: 3, pricePerInstallment: '1476.19047619048' },
      { count: 4, pricePerInstallment: '1142.85714285714' },
      { count: 5, pricePerInstallment: '952.380952380952' }
    ],
    membershipDurationMonths: 6,
    minDepositAmount: '600',
    name: 'Manifestation Academy (6 luni)',
    price: '3809.52380952381'
  },
  {
    extensions: [
      {
        extensionMonths: 6,
        installments: [{ count: 2, pricePerInstallment: '1173.1999999999998' }],
        minDepositAmount: '500',
        price: '2133.6'
      }
    ],
    installments: [
      { count: 2, pricePerInstallment: '1466.66666666667' },
      { count: 3, pricePerInstallment: '1033.333333333336' }
    ],
    membershipDurationMonths: 6,
    minDepositAmount: '400',
    name: 'Manifestation Academy (Campanie cu -30% discount)',
    price: '2666.666666666667'
  },
  {
    extensions: [
      {
        extensionMonths: 12,
        installments: [{ count: 2, pricePerInstallment: '1676' }],
        minDepositAmount: '500',
        price: '3048'
      }
    ],
    installments: [
      { count: 2, pricePerInstallment: '2095.2380952381' },
      { count: 3, pricePerInstallment: '1476.19047619048' },
      { count: 4, pricePerInstallment: '1142.85714285714' },
      { count: 5, pricePerInstallment: '952.380952380952' }
    ],
    membershipDurationMonths: 12,
    minDepositAmount: '600',
    name: 'Manifestation Academy (12 luni la preț de 6)',
    price: '3809.52380952381'
  },
  {
    extensions: [
      {
        extensionMonths: 6,
        installments: [{ count: 2, pricePerInstallment: '2347' }],
        minDepositAmount: '700',
        price: '4267'
      }
    ],
    installments: [
      { count: 2, pricePerInstallment: '3353' },
      { count: 3, pricePerInstallment: '2438.33333333333' }
    ],
    membershipDurationMonths: 6,
    minDepositAmount: '1000',
    name: 'Şcoala Reginelor (6 luni)',
    price: '6096'
  },
  {
    extensions: [
      {
        extensionMonths: 6,
        installments: [{ count: 2, pricePerInstallment: '1642.8999999999999' }],
        minDepositAmount: '700',
        price: '2986.8999999999996'
      }
    ],
    installments: [
      { count: 2, pricePerInstallment: '2347.1' },
      { count: 3, pricePerInstallment: '1706.8333333333308' }
    ],
    membershipDurationMonths: 6,
    minDepositAmount: '1000',
    name: 'Şcoala Reginelor (Campanie cu -30% discount)',
    price: '4267.2'
  },
  {
    extensions: [
      {
        extensionMonths: 12,
        installments: [{ count: 2, pricePerInstallment: '3353' }],
        minDepositAmount: '1000',
        price: '6096'
      }
    ],
    installments: [
      { count: 2, pricePerInstallment: '3353' },
      { count: 3, pricePerInstallment: '2438.33333333333' }
    ],
    membershipDurationMonths: 12,
    minDepositAmount: '1000',
    name: 'Şcoala Reginelor (12 luni la preț de 6)',
    price: '6096'
  }
].map((product) => {
  const productId = createId()

  const installments = product.installments.map((installment) => ({
    ...installment,
    id: createId(),
    productId
  }))

  const extensions = product.extensions.map((extension) => {
    const extensionId = createId()
    const installments = extension.installments?.map((installment) => ({
      ...installment,
      extensionId,
      id: createId()
    }))
    return { ...extension, id: extensionId, installments, productId }
  })

  return {
    ...product,
    extensions,
    id: productId,
    installments,
    isDepositAmountEnabled: true
  }
})

async function main() {
  try {
    const start = Date.now()
    console.group('Business data setup started')

    // Wave 1: Insert independent tables (no foreign key dependencies)
    await Promise.all([
      (async () => {
        const BankDetailsTableName = getTableUniqueName(schema.bank_details)
        console.group(BankDetailsTableName)
        console.log(`Processing ${BankDetailsTableName} data...`)
        await database.insert(schema.bank_details).values(BANK_DETAILS)
        console.groupEnd()
      })(),
      (async () => {
        const ConstantsTableName = getTableUniqueName(schema.constants)
        console.group(ConstantsTableName)
        console.log(`Processing ${ConstantsTableName} data...`)
        await database.insert(schema.constants).values(CONSTANTS)
        console.groupEnd()
      })(),
      (async () => {
        const FirstPaymentDateAfterDepositOptionsTableName = getTableUniqueName(
          schema.first_payment_date_after_deposit_options
        )
        console.group(FirstPaymentDateAfterDepositOptionsTableName)
        console.log(
          `Processing ${FirstPaymentDateAfterDepositOptionsTableName} data...`
        )
        await database
          .insert(schema.first_payment_date_after_deposit_options)
          .values(DEPOSIT_FIRST_PAYMENT_DATE_OPTIONS)
        console.groupEnd()
      })(),
      (async () => {
        const PaymentsSettingsTableName = getTableUniqueName(
          schema.payments_settings
        )
        console.group(PaymentsSettingsTableName)
        console.log(`Processing ${PaymentsSettingsTableName} data...`)
        await database
          .insert(schema.payments_settings)
          .values(PAYMENTS_SETTINGS)
        console.groupEnd()
      })(),
      (async () => {
        const ProductsTableName = getTableUniqueName(schema.products)
        console.group(ProductsTableName)
        console.log(`Processing ${ProductsTableName} data...`)
        await database.insert(schema.products).values(HARDCODED_PRODUCTS)
        console.groupEnd()
      })()
    ])

    // Wave 2: Insert tables that depend on products
    await Promise.all([
      (async () => {
        const ProductsInstallmentsTableName = getTableUniqueName(
          schema.products_installments
        )
        console.group(ProductsInstallmentsTableName)
        console.log(`Processing ${ProductsInstallmentsTableName} data...`)
        await database
          .insert(schema.products_installments)
          .values(
            HARDCODED_PRODUCTS.flatMap((product) => product.installments ?? [])
          )
        console.groupEnd()
      })(),
      (async () => {
        const ProductsExtensionsTableName = getTableUniqueName(
          schema.products_extensions
        )
        console.group(ProductsExtensionsTableName)
        console.log(`Processing ${ProductsExtensionsTableName} data...`)
        await database.insert(schema.products_extensions).values(
          HARDCODED_PRODUCTS.flatMap(
            (product) =>
              product?.extensions?.map((extension) => ({
                ...extension,
                isDepositAmountEnabled: true
              })) ?? []
          )
        )
        console.groupEnd()
      })()
    ])

    // Wave 3: Insert tables that depend on products_extensions
    await (async () => {
      const ProductsExtensionsInstallmentsTableName = getTableUniqueName(
        schema.products_extensions_installments
      )
      console.group(ProductsExtensionsInstallmentsTableName)
      console.log(
        `Processing ${ProductsExtensionsInstallmentsTableName} data...`
      )
      await database
        .insert(schema.products_extensions_installments)
        .values(
          HARDCODED_PRODUCTS.flatMap((product) =>
            (product.extensions ?? []).flatMap(
              (extension) => extension.installments ?? []
            )
          )
        )
      console.groupEnd()
    })()

    console.groupEnd()
    console.log(
      `Business data setup completed successfully in ${Date.now() - start}ms\n`
    )
    process.exit(0)
  } catch (error) {
    console.error('Error setting up business data', { cause: error })
    process.exit(1)
  }
}

main()
