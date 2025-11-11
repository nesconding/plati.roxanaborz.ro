import { faker } from '@faker-js/faker'
import { createId } from '@paralleldrive/cuid2'
import Decimal from 'decimal.js-light'

import { products, products_installments } from '~/server/database/schema'

import { HARDCODED_PRODUCTS } from './products'

export async function createProductsInstallmentsData(
  productsData: (typeof products.$inferSelect)[]
): Promise<(typeof products_installments.$inferInsert)[]> {
  const data: (typeof products_installments.$inferInsert)[] =
    HARDCODED_PRODUCTS.flatMap((product) => product.installments ?? [])

  const dynamicProducts = productsData.filter(
    (product) => !HARDCODED_PRODUCTS.some((h) => h.id === product.id)
  )

  for (const product of dynamicProducts) {
    let latestPrice = new Decimal(product.price)
    const installmentCount = faker.number.int({ min: 1, max: 6 })

    for (let i = 1; i <= installmentCount; i++) {
      latestPrice = latestPrice.add(
        latestPrice.mul(
          new Decimal(
            faker.number.int({ min: 10, max: 30, multipleOf: 5 })
          ).div(100)
        )
      )

      data.push({
        id: createId(),
        count: i + 1,
        pricePerInstallment: latestPrice.toString(),
        productId: product.id
      })
    }
  }

  return data
}
