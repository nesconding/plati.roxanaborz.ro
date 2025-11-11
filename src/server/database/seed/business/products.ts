import { faker } from '@faker-js/faker'
import { createId } from '@paralleldrive/cuid2'

import type { products } from '~/server/database/schema'

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

export async function createProductsData(): Promise<
  (typeof products.$inferInsert)[]
> {
  const productsData: (typeof products.$inferInsert)[] = HARDCODED_PRODUCTS

  // // Create dynamic products
  // const names = new Set<string>()

  // for (let i = 0; i < faker.number.int({ max: 30, min: 5 }); i++) {
  //   let name = faker.commerce.productName()
  //   while (names.has(name)) name = faker.commerce.productName()
  //   names.add(name)
  // }

  // for (const name of names) {
  //   const membershipDurationMonths = faker.number.int({
  //     max: 21,
  //     min: 3,
  //     multipleOf: 3
  //   })
  //   const isDepositAmountEnabled = faker.datatype.boolean()
  //   const price = faker.number.int({ max: 10000, min: 5000 }).toString()
  //   const minDepositAmount = isDepositAmountEnabled
  //     ? faker.number.int({ max: 1500, min: 500, multipleOf: 100 }).toString()
  //     : '0'
  //   const fullName = `${name} (${membershipDurationMonths} luni)`

  //   // Add to products array
  //   productsData.push({
  //     isDepositAmountEnabled,
  //     membershipDurationMonths,
  //     minDepositAmount,
  //     name: fullName,
  //     price
  //   })
  // }

  return productsData
}
