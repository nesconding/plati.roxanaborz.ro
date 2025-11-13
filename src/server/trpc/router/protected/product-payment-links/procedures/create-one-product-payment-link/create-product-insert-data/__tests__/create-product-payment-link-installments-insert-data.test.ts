import { describe, expect, it } from 'vitest'
import { createProductPaymentLinkInstallmentsInsertData } from '../create-product-payment-link-installments-insert-data'
import { mockRegularUser } from '#test/fixtures/users'
import { mockPaymentSettings } from '#test/fixtures/payment-settings'
import { createMockMeeting } from '#test/fixtures/meetings'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'

describe('createProductPaymentLinkInstallmentsInsertData', () => {
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
    baseProductInstallmentId: 'installment_123',
    productInstallmentId: 'installment_123',
    meetingId: 'meeting_123',
    paymentSettingId: 'settings_123',
    type: PaymentLinkType.Installments,
    hasInstallments: true as const
  }

  const mockBaseProductInstallment = {
    id: 'installment_123',
    productId: 'prod_123',
    pricePerInstallment: '100.00',
    count: 12
  }

  const expiresAt = new Date('2024-02-01T10:00:00.000Z')
  const eurToRonRate = '5.00'

  it('should create installments insert data correctly', () => {
    const result = createProductPaymentLinkInstallmentsInsertData({
      data: mockFormData,
      eurToRonRate,
      baseProductInstallment: mockBaseProductInstallment as any,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result.type).toBe(PaymentLinkType.Installments)
    expect(result.paymentProductType).toBe(PaymentProductType.Product)
    expect(result.status).toBe(PaymentStatusType.Created)
    expect(result.currency).toBe(PaymentCurrencyType.RON)

    // Verify installment-specific fields
    expect(result.productInstallmentId).toBe('installment_123')
    expect(result.productInstallmentsCount).toBe(12)
  })

  it('should calculate installment amounts correctly for RON', () => {
    const result = createProductPaymentLinkInstallmentsInsertData({
      data: mockFormData,
      eurToRonRate,
      baseProductInstallment: mockBaseProductInstallment as any,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Price per installment: 100 EUR * 5 = 500 RON
    // With 10% extra tax: 500 * 1.10 = 550
    // With 19% TVA: 550 * 1.19 = 654.5
    // Total: 654.5 * 12 = 7854

    expect(result.productInstallmentAmountToPay).toBe('654.5')
    expect(result.productInstallmentAmountToPayInCents).toBe('65450')
    expect(result.totalAmountToPay).toBe('7854')
    expect(result.totalAmountToPayInCents).toBe('785400')
  })

  it('should calculate installment amounts correctly for EUR', () => {
    const eurSetting = {
      ...mockSetting,
      currency: PaymentCurrencyType.EUR
    }

    const result = createProductPaymentLinkInstallmentsInsertData({
      data: mockFormData,
      eurToRonRate,
      baseProductInstallment: mockBaseProductInstallment as any,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: eurSetting as any,
      user: mockRegularUser as any
    })

    expect(result.currency).toBe(PaymentCurrencyType.EUR)

    // Price per installment: 100 EUR
    // With 10% extra tax: 100 * 1.10 = 110
    // With 19% TVA: 110 * 1.19 = 130.9
    // Total: 130.9 * 12 = 1570.8

    expect(result.productInstallmentAmountToPay).toBe('130.9')
    expect(result.productInstallmentAmountToPayInCents).toBe('13090')
    expect(result.totalAmountToPay).toBe('1570.8')
    expect(result.totalAmountToPayInCents).toBe('157080')
  })

  it('should handle different installment counts', () => {
    const installment6Months = {
      ...mockBaseProductInstallment,
      count: 6
    }

    const result = createProductPaymentLinkInstallmentsInsertData({
      data: mockFormData,
      eurToRonRate,
      baseProductInstallment: installment6Months as any,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result.productInstallmentsCount).toBe(6)

    // Installment amount stays the same (654.5)
    // Total: 654.5 * 6 = 3927
    expect(result.productInstallmentAmountToPay).toBe('654.5')
    expect(result.totalAmountToPay).toBe('3927')
  })

  it('should handle different prices per installment', () => {
    const expensiveInstallment = {
      ...mockBaseProductInstallment,
      pricePerInstallment: '200.00'
    }

    const result = createProductPaymentLinkInstallmentsInsertData({
      data: mockFormData,
      eurToRonRate,
      baseProductInstallment: expensiveInstallment as any,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    // Price per installment: 200 EUR * 5 = 1000 RON
    // With 10% extra tax: 1000 * 1.10 = 1100
    // With 19% TVA: 1100 * 1.19 = 1309
    // Total: 1309 * 12 = 15708

    expect(result.productInstallmentAmountToPay).toBe('1309')
    expect(result.totalAmountToPay).toBe('15708')
  })

  it('should handle 24-month installments', () => {
    const installment24Months = {
      ...mockBaseProductInstallment,
      pricePerInstallment: '50.00',
      count: 24
    }

    const result = createProductPaymentLinkInstallmentsInsertData({
      data: mockFormData,
      eurToRonRate,
      baseProductInstallment: installment24Months as any,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result.productInstallmentsCount).toBe(24)

    // Price per installment: 50 EUR * 5 = 250 RON
    // With 10% extra tax: 250 * 1.10 = 275
    // With 19% TVA: 275 * 1.19 = 327.25
    // Total: 327.25 * 24 = 7854

    expect(result.productInstallmentAmountToPay).toBe('327.25')
    expect(result.totalAmountToPay).toBe('7854')
  })

  it('should handle zero taxes', () => {
    const noTaxSetting = {
      ...mockSetting,
      extraTaxRate: '0.00',
      tvaRate: '0.00'
    }

    const result = createProductPaymentLinkInstallmentsInsertData({
      data: mockFormData,
      eurToRonRate,
      baseProductInstallment: mockBaseProductInstallment as any,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: noTaxSetting as any,
      user: mockRegularUser as any
    })

    // Price per installment: 100 EUR * 5 = 500 RON
    // With 0% taxes: 500
    // Total: 500 * 12 = 6000

    expect(result.productInstallmentAmountToPay).toBe('500')
    expect(result.totalAmountToPay).toBe('6000')
  })

  it('should include all required fields', () => {
    const result = createProductPaymentLinkInstallmentsInsertData({
      data: mockFormData,
      eurToRonRate,
      baseProductInstallment: mockBaseProductInstallment as any,
      expiresAt,
      meeting: createMockMeeting(),
      product: mockProduct as any,
      setting: mockSetting as any,
      user: mockRegularUser as any
    })

    expect(result).toHaveProperty('type')
    expect(result).toHaveProperty('paymentProductType')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('productInstallmentId')
    expect(result).toHaveProperty('productInstallmentsCount')
    expect(result).toHaveProperty('productInstallmentAmountToPay')
    expect(result).toHaveProperty('productInstallmentAmountToPayInCents')
    expect(result).toHaveProperty('totalAmountToPay')
    expect(result).toHaveProperty('totalAmountToPayInCents')
  })
})
