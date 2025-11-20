import { describe, expect, it } from 'vitest'
import { mockPaymentSettings } from '#test/fixtures/payment-settings'
import { createMockMeeting } from '#test/fixtures/scheduledEvents'
import { mockRegularUser } from '#test/fixtures/users'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { createProductPaymentLinkDepositInsertData } from '../create-product-payment-link-deposit-insert-data'

describe('createProductPaymentLinkDepositInsertData', () => {
  const mockProduct = {
    id: 'prod_123',
    membershipDurationMonths: 12,
    name: 'Test Product',
    price: '1000.00'
  }

  const mockSetting = {
    ...mockPaymentSettings,
    currency: PaymentCurrencyType.RON,
    extraTaxRate: '10.00',
    tvaRate: '19.00'
  }

  const mockFormData = {
    callerName: 'John Caller',
    contractId: 'contract_123',
    depositAmount: '1000.00',
    firstPaymentDateAfterDepositOptionId: 'option_123',
    hasDeposit: true as const,
    paymentMethodType: PaymentMethodType.Card,
    paymentSettingId: 'settings_123',
    productId: 'prod_123',
    scheduledEventUri: 'meeting_123',
    setterName: 'Jane Setter',
    type: PaymentLinkType.Deposit
  }

  const mockFirstPaymentOption = {
    id: 'option_123',
    value: 30 // 30 days
  }

  const expiresAt = new Date('2024-02-01T10:00:00.000Z')
  const eurToRonRate = '5.00'

  it('should create deposit insert data correctly', () => {
    const result = createProductPaymentLinkDepositInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result.type).toBe(PaymentLinkType.Deposit)
    expect(result.paymentProductType).toBe(PaymentProductType.Product)
    expect(result.status).toBe(PaymentStatusType.Created)
    expect(result.currency).toBe(PaymentCurrencyType.RON)

    // Verify deposit amount
    expect(result.depositAmount).toBe('1000.00')
    expect(result.depositAmountInCents).toBe('100000')
  })

  it('should calculate deposit amounts correctly', () => {
    const result = createProductPaymentLinkDepositInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Total: 1000 EUR * 5 = 5000 RON
    // With 10% extra tax: 5000 * 1.10 = 5500
    // With 19% TVA: 5500 * 1.19 = 6545
    // Deposit: 1000
    // Remaining: 6545 - 1000 = 5545

    expect(result.totalAmountToPay).toBe('6545')
    expect(result.totalAmountToPayInCents).toBe('654500')
    expect(result.depositAmount).toBe('1000.00')
    expect(result.depositAmountInCents).toBe('100000')
    expect(result.remainingAmountToPay).toBe('5545')
    expect(result.remainingAmountToPayInCents).toBe('554500')
  })

  it('should calculate firstPaymentDateAfterDeposit correctly', () => {
    const result = createProductPaymentLinkDepositInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Should be 30 days from now
    const firstPaymentDate = new Date(result.firstPaymentDateAfterDeposit)
    const now = new Date()
    const daysDiff = Math.round(
      (firstPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    expect(daysDiff).toBe(30)
  })

  it('should handle different deposit amounts', () => {
    const smallDepositData = {
      ...mockFormData,
      depositAmount: '500.00'
    }

    const result = createProductPaymentLinkDepositInsertData({
      data: smallDepositData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result.depositAmount).toBe('500.00')
    expect(result.depositAmountInCents).toBe('50000')
    expect(result.remainingAmountToPay).toBe('6045')
    expect(result.remainingAmountToPayInCents).toBe('604500')
  })

  it('should handle different firstPaymentDateAfterDeposit options', () => {
    const option60Days = {
      id: 'option_60',
      value: 60
    }

    const result = createProductPaymentLinkDepositInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: option60Days as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    const firstPaymentDate = new Date(result.firstPaymentDateAfterDeposit)
    const now = new Date()
    const daysDiff = Math.round(
      (firstPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    expect(daysDiff).toBe(60)
  })

  it('should handle EUR currency', () => {
    const eurSetting = {
      ...mockSetting,
      currency: PaymentCurrencyType.EUR
    }

    const result = createProductPaymentLinkDepositInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: eurSetting as any,
      user: mockRegularUser as any
    })

    expect(result.currency).toBe(PaymentCurrencyType.EUR)

    // Total: 1000 EUR
    // With 10% extra tax: 1000 * 1.10 = 1100
    // With 19% TVA: 1100 * 1.19 = 1309
    // Deposit: 1000
    // Remaining: 1309 - 1000 = 309

    expect(result.totalAmountToPay).toBe('1309')
    expect(result.remainingAmountToPay).toBe('309')
  })

  it('should handle large deposits (close to total)', () => {
    const largeDepositData = {
      ...mockFormData,
      depositAmount: '6000.00'
    }

    const result = createProductPaymentLinkDepositInsertData({
      data: largeDepositData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Total: 6545, Deposit: 6000, Remaining: 545
    expect(result.totalAmountToPay).toBe('6545')
    expect(result.depositAmount).toBe('6000.00')
    expect(result.remainingAmountToPay).toBe('545')
  })

  it('should include all required fields', () => {
    const result = createProductPaymentLinkDepositInsertData({
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result).toHaveProperty('type')
    expect(result).toHaveProperty('paymentProductType')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('depositAmount')
    expect(result).toHaveProperty('depositAmountInCents')
    expect(result).toHaveProperty('remainingAmountToPay')
    expect(result).toHaveProperty('remainingAmountToPayInCents')
    expect(result).toHaveProperty('firstPaymentDateAfterDeposit')
    expect(result).toHaveProperty('totalAmountToPay')
    expect(result).toHaveProperty('totalAmountToPayInCents')
  })
})
