import { describe, expect, it } from 'vitest'
import { mockPaymentSettings } from '#test/fixtures/payment-settings'
import { createMockMeeting } from '#test/fixtures/scheduledEvents'
import { mockRegularUser } from '#test/fixtures/users'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { createProductPaymentLinkInstallmentsDepositInsertData } from '../create-product-payment-link-installments-deposit-insert-data'

describe('createProductPaymentLinkInstallmentsDepositInsertData', () => {
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
    baseProductInstallmentId: 'installment_123',
    callerName: 'John Caller',
    contractId: 'contract_123',
    depositAmount: '1000.00',
    firstPaymentDateAfterDepositOptionId: 'option_123',
    hasDeposit: true as const,
    hasInstallments: true as const,
    paymentMethodType: PaymentMethodType.Card,
    paymentSettingId: 'settings_123',
    productId: 'prod_123',
    productInstallmentId: 'installment_123',
    scheduledEventId: 'meeting_123',
    setterName: 'Jane Setter',
    type: PaymentLinkType.InstallmentsDeposit
  }

  const mockBaseProductInstallment = {
    count: 12,
    id: 'installment_123',
    pricePerInstallment: '100.00',
    productId: 'prod_123'
  }

  const mockFirstPaymentOption = {
    id: 'option_123',
    value: 30 // 30 days
  }

  const expiresAt = new Date('2024-02-01T10:00:00.000Z')
  const eurToRonRate = '5.00'

  it('should create installments deposit insert data correctly', () => {
    const result = createProductPaymentLinkInstallmentsDepositInsertData({
      baseProductInstallment: mockBaseProductInstallment as any,
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result.type).toBe(PaymentLinkType.InstallmentsDeposit)
    expect(result.paymentProductType).toBe(PaymentProductType.Product)
    expect(result.status).toBe(PaymentStatusType.Created)
    expect(result.currency).toBe(PaymentCurrencyType.RON)

    // Verify combined fields
    expect(result.productInstallmentId).toBe('installment_123')
    expect(result.productInstallmentsCount).toBe(12)
    expect(result.depositAmount).toBe('1000.00')
  })

  it('should calculate amounts correctly', () => {
    const result = createProductPaymentLinkInstallmentsDepositInsertData({
      baseProductInstallment: mockBaseProductInstallment as any,
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Price per installment: 100 EUR * 5 = 500 RON
    // With 10% extra tax: 500 * 1.10 = 550
    // With 19% TVA: 550 * 1.19 = 654.5
    // Full installment amount: 654.5
    // Total: 654.5 * 12 = 7854
    // Deposit: 1000
    // Remaining: 7854 - 1000 = 6854
    // Remaining per installment: 6854 / 12 = 571.166666...

    expect(result.productInstallmentAmountToPay).toBe('654.5')
    expect(result.productInstallmentAmountToPayInCents).toBe('65450')
    expect(result.totalAmountToPay).toBe('7854')
    expect(result.totalAmountToPayInCents).toBe('785400')
    expect(result.depositAmount).toBe('1000.00')
    expect(result.depositAmountInCents).toBe('100000')
    expect(result.remainingAmountToPay).toBe('6854')
    expect(result.remainingAmountToPayInCents).toBe('685400')
    expect(result.remainingInstallmentAmountToPay).toBe('571.16666666666666666')
    expect(result.remainingInstallmentAmountToPayInCents).toBe('57117')
  })

  it('should handle large deposits', () => {
    const largeDepositData = {
      ...mockFormData,
      depositAmount: '5000.00'
    }

    const result = createProductPaymentLinkInstallmentsDepositInsertData({
      baseProductInstallment: mockBaseProductInstallment as any,
      data: largeDepositData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Total: 7854, Deposit: 5000, Remaining: 2854
    // Remaining per installment: 2854 / 12 = 237.833...

    expect(result.depositAmount).toBe('5000.00')
    expect(result.remainingAmountToPay).toBe('2854')
    expect(result.remainingInstallmentAmountToPay).toBe('237.83333333333333333')
  })

  it('should handle small deposits', () => {
    const smallDepositData = {
      ...mockFormData,
      depositAmount: '100.00'
    }

    const result = createProductPaymentLinkInstallmentsDepositInsertData({
      baseProductInstallment: mockBaseProductInstallment as any,
      data: smallDepositData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Total: 7854, Deposit: 100, Remaining: 7754
    // Remaining per installment: 7754 / 12 = 646.166...

    expect(result.depositAmount).toBe('100.00')
    expect(result.remainingAmountToPay).toBe('7754')
    expect(result.remainingInstallmentAmountToPay).toBe('646.16666666666666666')
  })

  it('should calculate firstPaymentDateAfterDeposit correctly', () => {
    const result = createProductPaymentLinkInstallmentsDepositInsertData({
      baseProductInstallment: mockBaseProductInstallment as any,
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
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

    expect(daysDiff).toBe(30)
  })

  it('should handle different installment counts with deposit', () => {
    const installment6Months = {
      ...mockBaseProductInstallment,
      count: 6
    }

    const result = createProductPaymentLinkInstallmentsDepositInsertData({
      baseProductInstallment: installment6Months as any,
      data: mockFormData,
      eurToRonRate,
      expiresAt,
      firstPaymentDateAfterDepositOption: mockFirstPaymentOption as any,
      product: mockProduct as any,
      scheduledEvent: createMockMeeting(),
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result.productInstallmentsCount).toBe(6)

    // Total: 654.5 * 6 = 3927
    // Deposit: 1000
    // Remaining: 3927 - 1000 = 2927
    // Remaining per installment: 2927 / 6 = 487.833...

    expect(result.totalAmountToPay).toBe('3927')
    expect(result.remainingAmountToPay).toBe('2927')
    expect(result.remainingInstallmentAmountToPay).toBe('487.83333333333333333')
  })

  it('should handle EUR currency', () => {
    const eurSetting = {
      ...mockSetting,
      currency: PaymentCurrencyType.EUR
    }

    const result = createProductPaymentLinkInstallmentsDepositInsertData({
      baseProductInstallment: mockBaseProductInstallment as any,
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

    // Price per installment: 100 EUR
    // With taxes: 130.9
    // Total: 130.9 * 12 = 1570.8
    // Deposit: 1000
    // Remaining: 1570.8 - 1000 = 570.8
    // Remaining per installment: 570.8 / 12 = 47.566...

    expect(result.productInstallmentAmountToPay).toBe('130.9')
    expect(result.totalAmountToPay).toBe('1570.8')
    expect(result.remainingAmountToPay).toBe('570.8')
  })

  it('should include all required fields', () => {
    const result = createProductPaymentLinkInstallmentsDepositInsertData({
      baseProductInstallment: mockBaseProductInstallment as any,
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
    expect(result).toHaveProperty('productInstallmentId')
    expect(result).toHaveProperty('productInstallmentsCount')
    expect(result).toHaveProperty('depositAmount')
    expect(result).toHaveProperty('depositAmountInCents')
    expect(result).toHaveProperty('firstPaymentDateAfterDeposit')
    expect(result).toHaveProperty('productInstallmentAmountToPay')
    expect(result).toHaveProperty('productInstallmentAmountToPayInCents')
    expect(result).toHaveProperty('remainingAmountToPay')
    expect(result).toHaveProperty('remainingAmountToPayInCents')
    expect(result).toHaveProperty('remainingInstallmentAmountToPay')
    expect(result).toHaveProperty('remainingInstallmentAmountToPayInCents')
    expect(result).toHaveProperty('totalAmountToPay')
    expect(result).toHaveProperty('totalAmountToPayInCents')
  })
})
