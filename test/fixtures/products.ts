import type {
  products,
  products_extensions,
  products_installments
} from '~/server/database/schema'

type Product = typeof products.$inferSelect
type ProductExtension = typeof products_extensions.$inferSelect
type ProductInstallment = typeof products_installments.$inferSelect

/**
 * Test fixture data for products and extensions
 */

export const mockProduct: Product = {
  id: 'prod_123',
  name: 'Test Product',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  price: '5000.00',
  minDepositAmount: '500.00',
  isDepositAmountEnabled: true,
  membershipDurationMonths: 12
}

export const mockProductExtension: ProductExtension = {
  id: 'ext_123',
  productId: 'prod_123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  price: '500.00',
  minDepositAmount: '50.00',
  isDepositAmountEnabled: true,
  extensionMonths: 12
}

export const mockProductInstallment: ProductInstallment = {
  id: 'inst_123',
  productId: 'prod_123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
  count: 12,
  pricePerInstallment: '500.00'
}

export const mockProductExtensionInstallment = {
  id: 'ext_inst_123',
  productExtensionId: 'ext_123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  installmentsCount: 6,
  pricePerInstallmentInEuros: '20.00',
  pricePerInstallmentInRon: '100.00'
}

export const createMockProduct = (overrides?: Partial<Product>): Product => ({
  ...mockProduct,
  ...overrides
})

export const createMockProductExtension = (
  overrides?: Partial<ProductExtension>
): ProductExtension => ({
  ...mockProductExtension,
  ...overrides
})

export const createMockProductInstallment = (
  overrides?: Partial<ProductInstallment>
): ProductInstallment => ({
  ...mockProductInstallment,
  ...overrides
})
