/** biome-ignore-all assist/source/useSortedKeys: <> */
import * as schema from '~/server/database/schema'
import { seedUsers } from '~/server/database/seed/authentication/users'
import { seedUsersAccounts } from '~/server/database/seed/authentication/users-accounts'
import { createConstantsData } from '~/server/database/seed/business/constants'
import { createFirstPaymentDateAfterDepositOptionsData } from '~/server/database/seed/business/deposit-first-payment-options'
import { createPaymentsSettingsData } from '~/server/database/seed/business/payments-settings'
import { createProductsData } from '~/server/database/seed/business/products'
import { createProductsExtensionsData } from '~/server/database/seed/business/products-extensions'
import { createProductsExtensionsInstallmentsData } from '~/server/database/seed/business/products-extensions-installments'
import { createProductsInstallmentsData } from '~/server/database/seed/business/products-installments'
import { formatCount, seedTable } from '~/server/database/seed/utils'
import { createContractsData } from './business/contracts'

export async function seed() {
  const start = Date.now()
  console.group(`Seeding database...\n`)

  try {
    // Authentication
    const [usersName, users] = await seedUsers()
    const [usersAccountsName, usersAccounts] = await seedUsersAccounts(users)

    // Products
    const [productsName, products] = await seedTable(
      schema.products,
      createProductsData
    )
    const [productsInstallmentsName, productsInstallments] = await seedTable(
      schema.products_installments,
      () => createProductsInstallmentsData(products)
    )
    const [productsExtensionsName, productsExtensions] = await seedTable(
      schema.products_extensions,
      () => createProductsExtensionsData(products)
    )
    const [productsExtensionsInstallmentsName, productsExtensionsInstallments] =
      await seedTable(schema.products_extensions_installments, () =>
        createProductsExtensionsInstallmentsData(productsExtensions)
      )

    // Business
    const [constantsName, constants] = await seedTable(schema.constants, () =>
      createConstantsData()
    )
    const [contractsName, contracts] = await seedTable(schema.contracts, () =>
      createContractsData()
    )
    const [
      firstPaymentDateAfterDepositOptionsName,
      firstPaymentDateAfterDepositOptions
    ] = await seedTable(schema.first_payment_date_after_deposit_options, () =>
      createFirstPaymentDateAfterDepositOptionsData()
    )
    const [paymentsSettingsName, paymentsSettings] = await seedTable(
      schema.payments_settings,
      () => createPaymentsSettingsData()
    )

    console.log(`\nSeeded database in ${(Date.now() - start) / 1000}s\n`)
    console.groupEnd()
    console.group('Summary')
    console.table([
      // Authentication
      { name: usersName, count: formatCount(users.length) },
      { name: usersAccountsName, count: formatCount(usersAccounts.length) },

      // Products
      { count: formatCount(products.length), name: productsName },
      {
        name: productsInstallmentsName,
        count: formatCount(productsInstallments.length)
      },
      {
        name: productsExtensionsName,
        count: formatCount(productsExtensions.length)
      },
      {
        name: productsExtensionsInstallmentsName,
        count: formatCount(productsExtensionsInstallments.length)
      },
      // Business
      {
        name: constantsName,
        count: formatCount(constants.length)
      },
      {
        name: contractsName,
        count: formatCount(contracts.length)
      },
      {
        name: firstPaymentDateAfterDepositOptionsName,
        count: formatCount(firstPaymentDateAfterDepositOptions.length)
      },
      {
        name: paymentsSettingsName,
        count: formatCount(paymentsSettings.length)
      },
      // ---TOTAL---
      {
        name: 'TOTAL',
        count: formatCount(
          // Authentication
          users.length +
            usersAccounts.length +
            // Products
            products.length +
            productsInstallments.length +
            productsExtensions.length +
            productsExtensionsInstallments.length +
            // Business
            constants.length +
            contracts.length +
            firstPaymentDateAfterDepositOptions.length +
            paymentsSettings.length
        )
      }
    ])
  } catch (error) {
    console.error(new Error('Error seeding database', { cause: error }))
  }
}

await seed()
