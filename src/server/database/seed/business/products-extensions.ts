import { faker } from '@faker-js/faker'
import { createId } from '@paralleldrive/cuid2'
import Decimal from 'decimal.js-light'

import type { products, products_extensions } from '~/server/database/schema'

import { HARDCODED_PRODUCTS } from './products'

export async function createProductsExtensionsData(
  productsData: (typeof products.$inferSelect)[]
): Promise<(typeof products_extensions.$inferInsert)[]> {
  const data: (typeof products_extensions.$inferInsert)[] =
    HARDCODED_PRODUCTS.flatMap(
      (product) =>
        product?.extensions?.map((extension) => ({
          ...extension,
          isDepositAmountEnabled: true
        })) ?? []
    )

  const dynamicProducts = productsData.filter(
    (product) => !HARDCODED_PRODUCTS.some((h) => h.id === product.id)
  )

  for (const product of dynamicProducts) {
    let latestPrice = new Decimal(product.price)
    const extensionMonthsCount = faker.number.int({
      max: product.membershipDurationMonths,
      min: 1
    })

    for (let i = 1; i <= extensionMonthsCount; i++) {
      latestPrice = latestPrice.add(
        latestPrice.mul(
          new Decimal(
            faker.number.int({ max: 30, min: 10, multipleOf: 5 })
          ).div(100)
        )
      )

      const isDepositAmountEnabled = faker.datatype.boolean()
      const minDepositAmount = isDepositAmountEnabled
        ? faker.number.int({ max: 500, min: 500, multipleOf: 100 }).toString()
        : '0'

      data.push({
        extensionMonths: i + 1,
        id: createId(),
        isDepositAmountEnabled,
        minDepositAmount,
        price: latestPrice.toString(),
        productId: product.id
      })
    }
  }

  return data
}
