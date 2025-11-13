import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'

/**
 * E2E Payment Fixtures
 * Test data for payment scenarios used in e2e tests
 */

export const e2ePaymentScenarios = {
  productIntegral: {
    type: PaymentLinkType.Integral,
    productId: 'e2e_product_basic',
    contractId: 'e2e_contract_1',
    customerEmail: 'customer1.e2e@example.com',
    customerName: 'E2E Customer One',
    currency: PaymentCurrencyType.RON,
    paymentMethodType: PaymentMethodType.Card,
    totalAmount: '1000.00',
    totalAmountInCents: '100000'
  },
  productDeposit: {
    type: PaymentLinkType.Deposit,
    productId: 'e2e_product_deposit',
    contractId: 'e2e_contract_1',
    customerEmail: 'customer1.e2e@example.com',
    customerName: 'E2E Customer One',
    currency: PaymentCurrencyType.RON,
    paymentMethodType: PaymentMethodType.Card,
    totalAmount: '5000.00',
    totalAmountInCents: '500000',
    depositAmount: '500.00',
    depositAmountInCents: '50000',
    remainingAmount: '4500.00',
    remainingAmountInCents: '450000'
  },
  productInstallments: {
    type: PaymentLinkType.Installments,
    productId: 'e2e_product_installments',
    contractId: 'e2e_contract_1',
    customerEmail: 'customer1.e2e@example.com',
    customerName: 'E2E Customer One',
    currency: PaymentCurrencyType.RON,
    paymentMethodType: PaymentMethodType.Card,
    installmentsCount: 12,
    installmentAmount: '500.00',
    installmentAmountInCents: '50000',
    totalAmount: '6000.00',
    totalAmountInCents: '600000'
  },
  productInstallmentsDeposit: {
    type: PaymentLinkType.InstallmentsDeposit,
    productId: 'e2e_product_installments',
    contractId: 'e2e_contract_1',
    customerEmail: 'customer1.e2e@example.com',
    customerName: 'E2E Customer One',
    currency: PaymentCurrencyType.RON,
    paymentMethodType: PaymentMethodType.Card,
    depositAmount: '1000.00',
    depositAmountInCents: '100000',
    installmentsCount: 12,
    installmentAmount: '500.00',
    installmentAmountInCents: '50000',
    totalAmount: '7000.00',
    totalAmountInCents: '700000'
  },
  extensionIntegral: {
    type: PaymentLinkType.Integral,
    extensionId: 'e2e_extension_basic',
    customerEmail: 'customer1.e2e@example.com',
    customerName: 'E2E Customer One',
    currency: PaymentCurrencyType.RON,
    paymentMethodType: PaymentMethodType.Card,
    totalAmount: '500.00',
    totalAmountInCents: '50000'
  },
  extensionDeposit: {
    type: PaymentLinkType.Deposit,
    extensionId: 'e2e_extension_deposit',
    customerEmail: 'customer1.e2e@example.com',
    customerName: 'E2E Customer One',
    currency: PaymentCurrencyType.RON,
    paymentMethodType: PaymentMethodType.Card,
    depositAmount: '200.00',
    depositAmountInCents: '20000',
    totalAmount: '1000.00',
    totalAmountInCents: '100000',
    remainingAmount: '800.00',
    remainingAmountInCents: '80000'
  }
} as const

export const e2eStripeCards = {
  success: {
    number: '4242424242424242',
    expiry: '12/30',
    cvc: '123',
    zip: '12345'
  },
  declined: {
    number: '4000000000000002',
    expiry: '12/30',
    cvc: '123',
    zip: '12345'
  },
  requiresAuth: {
    number: '4000002500003155',
    expiry: '12/30',
    cvc: '123',
    zip: '12345'
  },
  insufficientFunds: {
    number: '4000000000009995',
    expiry: '12/30',
    cvc: '123',
    zip: '12345'
  }
} as const
