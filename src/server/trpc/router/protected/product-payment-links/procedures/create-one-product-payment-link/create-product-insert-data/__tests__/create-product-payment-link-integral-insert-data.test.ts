import { describe, expect, it } from 'vitest'
import {
  createProductPaymentLinkIntegralInsertData,
  type ProductPaymentLinkIntegralInsertData
} from '../create-product-payment-link-integral-insert-data'
import { mockRegularUser } from '#test/fixtures/users'
import { mockPaymentSettings } from '#test/fixtures/payment-settings'
import { createMockMeeting } from '#test/fixtures/meetings'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'

describe('createProductPaymentLinkIntegralInsertData', () => {
  const mockProduct = {
    id: 'prod_123',
    name: 'Test Product',
    price: '1000.00',
    membershipDurationMonths: 12
  }

  const mockSetting = {
    ...mockPaymentSettings,
    currency: PaymentCurrencyType.RON,
    extraTaxRate: '10.00',
    tvaRate: '19.00'
  }

  const mockFormData = {
    productId: 'prod_123',
    callerName: 'John Caller',
    setterName: 'Jane Setter',
    contractId: 'contract_123',
    paymentMethodType: PaymentMethodType.Card,
    meetingId: 'meeting_123',
    paymentSettingId: 'settings_123',
    type: PaymentLinkType.Integral as const
  }

  const expiresAt = new Date('2024-02-01T10:00:00.000Z')
  const eurToRonRate = '5.00'

  it('should create integral insert data with RON currency', () => {
    const result = createProductPaymentLinkIntegralInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Verify basic fields
    expect(result.type).toBe(PaymentLinkType.Integral)
    expect(result.paymentProductType).toBe(PaymentProductType.Product)
    expect(result.status).toBe(PaymentStatusType.Created)
    expect(result.currency).toBe(PaymentCurrencyType.RON)

    // Verify user data
    expect(result.createdById).toBe(mockRegularUser.id)
    expect(result.callerName).toBe('John Caller')
    expect(result.setterName).toBe('Jane Setter')
    expect(result.contractId).toBe('contract_123')

    // Verify product data
    expect(result.productId).toBe('prod_123')
    expect(result.productName).toBe('Test Product')

    // Verify customer data from meeting
    expect(result.customerEmail).toBe('test@example.com')
    expect(result.customerName).toBe('Test Customer')

    // Verify payment method
    expect(result.paymentMethodType).toBe(PaymentMethodType.Card)

    // Verify dates
    expect(result.expiresAt).toBe('2024-02-01T10:00:00.000Z')

    // Verify exchange rate
    expect(result.eurToRonRate).toBe('5.00')

    // Verify tax rates
    expect(result.extraTaxRate).toBe('10.00')
    expect(result.tvaRate).toBe('19.00')
  })

  it('should calculate correct amounts for RON currency', () => {
    const result = createProductPaymentLinkIntegralInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Price: 1000 EUR * 5 = 5000 RON
    // With 10% extra tax: 5000 * 1.10 = 5500
    // With 19% TVA: 5500 * 1.19 = 6545
    expect(result.totalAmountToPay).toBe('6545')
    expect(result.totalAmountToPayInCents).toBe('654500')
  })

  it('should use product price directly when currency is EUR', () => {
    const eurSetting = {
      ...mockSetting,
      currency: PaymentCurrencyType.EUR
    }

    const result = createProductPaymentLinkIntegralInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: eurSetting as any,
      user: mockRegularUser as any
    })

    expect(result.currency).toBe(PaymentCurrencyType.EUR)

    // Price: 1000 EUR
    // With 10% extra tax: 1000 * 1.10 = 1100
    // With 19% TVA: 1100 * 1.19 = 1309
    expect(result.totalAmountToPay).toBe('1309')
    expect(result.totalAmountToPayInCents).toBe('130900')
  })

  it('should handle zero tax rates', () => {
    const noTaxSetting = {
      ...mockSetting,
      extraTaxRate: '0.00',
      tvaRate: '0.00'
    }

    const result = createProductPaymentLinkIntegralInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: noTaxSetting as any,
      user: mockRegularUser as any
    })

    // Price: 1000 EUR * 5 = 5000 RON
    // With 0% taxes: 5000
    expect(result.totalAmountToPay).toBe('5000')
    expect(result.totalAmountToPayInCents).toBe('500000')
  })

  it('should handle different product prices', () => {
    const expensiveProduct = {
      ...mockProduct,
      price: '5000.00'
    }

    const result = createProductPaymentLinkIntegralInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      meeting: createMockMeeting(),
      product: expensiveProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Price: 5000 EUR * 5 = 25000 RON
    // With 10% extra tax: 25000 * 1.10 = 27500
    // With 19% TVA: 27500 * 1.19 = 32725
    expect(result.totalAmountToPay).toBe('32725')
    expect(result.totalAmountToPayInCents).toBe('3272500')
  })

  it('should handle different exchange rates', () => {
    const result = createProductPaymentLinkIntegralInsertData({
      data: mockFormData,
      eurToRonRate: '4.95',
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result.eurToRonRate).toBe('4.95')

    // Price: 1000 EUR * 4.95 = 4950 RON
    // With 10% extra tax: 4950 * 1.10 = 5445
    // With 19% TVA: 5445 * 1.19 = 6479.55
    expect(result.totalAmountToPay).toBe('6479.55')
    expect(result.totalAmountToPayInCents).toBe('647955')
  })

  it('should handle different payment methods', () => {
    const bankTransferFormData = {
      ...mockFormData,
      paymentMethodType: PaymentMethodType.BankTransfer
    }

    const result = createProductPaymentLinkIntegralInsertData({
      data: bankTransferFormData,
      eurToRonRate,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result.paymentMethodType).toBe(PaymentMethodType.BankTransfer)
  })

  it('should create consistent structure', () => {
    const result = createProductPaymentLinkIntegralInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Verify all required fields are present
    const requiredFields: Array<keyof ProductPaymentLinkIntegralInsertData> = [
      'type',
      'paymentProductType',
      'status',
      'currency',
      'createdById',
      'callerName',
      'setterName',
      'contractId',
      'productId',
      'productName',
      'customerEmail',
      'customerName',
      'paymentMethodType',
      'expiresAt',
      'eurToRonRate',
      'extraTaxRate',
      'tvaRate',
      'totalAmountToPay',
      'totalAmountToPayInCents'
    ]

    requiredFields.forEach(field => {
      expect(result).toHaveProperty(field)
      expect(result[field]).toBeDefined()
    })
  })
})
