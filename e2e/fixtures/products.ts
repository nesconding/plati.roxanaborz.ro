/**
 * E2E Product Fixtures
 * Test data for products used in e2e tests
 */

export const e2eProducts = {
  basic: {
    id: 'e2e_product_basic',
    name: 'Basic Membership',
    price: '1000.00',
    membershipDurationMonths: 12,
    isDepositAmountEnabled: false
  },
  withDeposit: {
    id: 'e2e_product_deposit',
    name: 'Premium Membership with Deposit',
    price: '5000.00',
    membershipDurationMonths: 24,
    isDepositAmountEnabled: true,
    minDepositAmount: '500.00'
  },
  withInstallments: {
    id: 'e2e_product_installments',
    name: 'Installments Membership',
    price: '6000.00',
    membershipDurationMonths: 12,
    isDepositAmountEnabled: false
  }
} as const

export const e2eExtensions = {
  basic: {
    id: 'e2e_extension_basic',
    productId: 'e2e_product_basic',
    price: '500.00',
    extensionMonths: 6
  },
  withDeposit: {
    id: 'e2e_extension_deposit',
    productId: 'e2e_product_basic',
    price: '1000.00',
    extensionMonths: 12
  }
} as const

export const e2eInstallments = {
  twelveMonths: {
    id: 'e2e_installment_12',
    productId: 'e2e_product_installments',
    count: 12,
    pricePerInstallment: '500.00'
  },
  sixMonths: {
    id: 'e2e_installment_6',
    productId: 'e2e_product_installments',
    count: 6,
    pricePerInstallment: '1000.00'
  }
} as const
