import { faker } from '@faker-js/faker'
import { createId } from '@paralleldrive/cuid2'
import Decimal from 'decimal.js-light'

import type {
  products_extensions,
  products_extensions_installments
} from '~/server/database/schema'

import { HARDCODED_PRODUCTS } from './products'

export async function createProductsExtensionsInstallmentsData(
  productsExtensionsData: (typeof products_extensions.$inferSelect)[]
): Promise<(typeof products_extensions_installments.$inferInsert)[]> {
  const data: (typeof products_extensions_installments.$inferInsert)[] =
    HARDCODED_PRODUCTS.flatMap((product) =>
      (product.extensions ?? []).flatMap(
        (extension) => extension.installments ?? []
      )
    )

  const dynamicProductsExtensions = productsExtensionsData.filter(
    (productExtension) =>
      !HARDCODED_PRODUCTS.some((h) => h.id === productExtension.productId)
  )

  for (const productExtension of dynamicProductsExtensions) {
    let latestPrice = new Decimal(productExtension.price)
    const installmentCount = faker.number.int({ max: 3, min: 1 })

    for (let i = 1; i <= installmentCount; i++) {
      latestPrice = latestPrice.add(
        latestPrice.mul(
          new Decimal(
            faker.number.int({ max: 30, min: 10, multipleOf: 5 })
          ).div(100)
        )
      )

      data.push({
        count: i + 1,
        extensionId: productExtension.id,
        id: createId(),
        pricePerInstallment: latestPrice.toString()
      })
    }
  }

  return data
}
