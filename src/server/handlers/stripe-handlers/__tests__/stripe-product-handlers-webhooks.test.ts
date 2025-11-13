import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StripeProductHandlers } from '../stripe-product-handlers'
import type Stripe from 'stripe'
import {
  mockDatabase,
  resetDatabaseMocks,
  mockRelationalFindFirst,
  mockInsertSuccess,
  mockUpdateSuccess
} from '#test/mocks/database'
import { mockProduct } from '#test/fixtures/products'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import type {
  PaymentIntentProductIntegralMetadata,
  PaymentIntentProductDepositMetadata,
  PaymentIntentProductInstallmentsMetadata,
  PaymentIntentProductInstallmentsDepositMetadata
} from '~/server/services/stripe'

// Mock the DatesService
vi.mock('~/server/services/dates', () => {
  return {
    DatesService: {
      addMonths: vi.fn((date: Date | string, months: number) => {
        const result = new Date(date)
        result.setMonth(result.getMonth() + months)
        return result
      }),
      addDays: vi.fn((date: Date | string, days: number) => {
        const result = new Date(date)
        result.setDate(result.getDate() + days)
        return result
      }),
      startOfDay: vi.fn((date: Date | string) => {
        const result = new Date(date)
        result.setHours(0, 0, 0, 0)
        return result
      }),
      endOfDay: vi.fn((date: Date | string) => {
        const result = new Date(date)
        result.setHours(23, 59, 59, 999)
        return result
      }),
      isAfter: vi.fn((date1: Date, date2: Date) => date1 > date2),
      isBefore: vi.fn((date1: Date, date2: Date) => date1 < date2)
    }
  }
})

// Mock the StripeService
vi.mock('~/server/services/stripe', () => {
  return {
    StripeService: {
      createPaymentIntent: vi.fn(),
      findPaymentIntentById: vi.fn(),
      chargeDeferredPayment: vi.fn(),
      chargeInstallmentPayment: vi.fn()
    },
    // Export types for use in tests
    PaymentLinkType: {},
    PaymentProductType: {}
  }
})

describe('StripeProductHandlers - Webhook Handlers', () => {
  let handler: StripeProductHandlers

  beforeEach(() => {
    resetDatabaseMocks()
    // @ts-expect-error - mockDatabase is a partial mock
    handler = new StripeProductHandlers(mockDatabase)
  })

  describe('handleProductIntegralPayment', () => {
    const mockIntegralMetadata = {
      type: PaymentLinkType.Integral,
      paymentProductType: PaymentProductType.Product,
      productPaymentLinkId: 'ppl_integral_123',
      productId: 'prod_123',
      customerEmail: 'customer@example.com',
      customerName: 'Test Customer',
      totalAmountToPayInCents: '500000',
      currency: PaymentCurrencyType.RON,
      paymentMethodType: PaymentMethodType.Card
    }

    it('should handle Product Integral payment successfully', async () => {
      // Mock the product query
      mockRelationalFindFirst('products', {
        ...mockProduct,
        membershipDurationMonths: 12
      })

      // Mock the payment link update
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      // Mock order creation
      const mockOrder = {
        id: 'order_123',
        customerEmail: mockIntegralMetadata.customerEmail,
        customerName: mockIntegralMetadata.customerName,
        productPaymentLinkId: mockIntegralMetadata.productPaymentLinkId,
        status: OrderStatusType.Completed,
        stripePaymentIntentId: 'pi_123',
        type: OrderType.OneTimePaymentOrder,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        deletedAt: null
      }
      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValueOnce([mockOrder])

      // Mock membership creation
      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValueOnce([
        {
          id: 'membership_123',
          status: MembershipStatusType.Active
        }
      ])

      await handler.handleProductIntegralPayment(
        'pi_123',
        mockIntegralMetadata as any
      )

      // Verify payment link status update
      expect(mockDatabase.update).toHaveBeenCalled()

      // Verify order creation
      expect(mockDatabase.insert).toHaveBeenCalled()
      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: mockIntegralMetadata.customerEmail,
          customerName: mockIntegralMetadata.customerName,
          productPaymentLinkId: mockIntegralMetadata.productPaymentLinkId,
          status: OrderStatusType.Completed,
          stripePaymentIntentId: 'pi_123',
          type: OrderType.OneTimePaymentOrder
        })
      )

      // Verify membership creation
      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          parentOrderId: mockOrder.id,
          status: MembershipStatusType.Active
        })
      )
    })

    it('should throw error if product not found', async () => {
      mockRelationalFindFirst('products', undefined)

      await expect(
        handler.handleProductIntegralPayment('pi_123', mockIntegralMetadata as any)
      ).rejects.toThrow('Product not found')
    })
  })

  describe('handleProductDepositPayment', () => {
    const mockDepositMetadata = {
      type: PaymentLinkType.Deposit,
      paymentProductType: PaymentProductType.Product,
      productPaymentLinkId: 'ppl_deposit_123',
      productId: 'prod_123',
      customerEmail: 'customer@example.com',
      customerName: 'Test Customer',
      totalAmountToPayInCents: '500000',
      depositAmountInCents: '100000',
      remainingAmountToPayInCents: '400000',
      firstPaymentDateAfterDeposit: '2024-02-01T00:00:00.000Z',
      currency: PaymentCurrencyType.RON,
      paymentMethodType: PaymentMethodType.Card
    }

    it('should handle Product Deposit payment successfully', async () => {
      // Mock the product query
      mockRelationalFindFirst('products', {
        ...mockProduct,
        membershipDurationMonths: 12
      })

      // Mock payment link update
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      // Mock order creation
      const mockOrder = {
        id: 'order_deposit_123',
        customerEmail: mockDepositMetadata.customerEmail,
        customerName: mockDepositMetadata.customerName,
        productPaymentLinkId: mockDepositMetadata.productPaymentLinkId,
        status: OrderStatusType.Completed,
        stripePaymentIntentId: 'pi_deposit_123',
        type: OrderType.ParentOrder
      }
      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([
          {
            id: 'membership_delayed_123',
            status: MembershipStatusType.Delayed
          }
        ])
        .mockResolvedValueOnce([
          {
            id: 'subscription_123',
            status: SubscriptionStatusType.Active
          }
        ])

      await handler.handleProductDepositPayment(
        'pi_deposit_123',
        mockDepositMetadata as any
      )

      // Verify payment link status update
      expect(mockDatabase.update).toHaveBeenCalled()

      // Verify order creation with ParentOrder type
      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: OrderType.ParentOrder,
          status: OrderStatusType.Completed
        })
      )

      // Verify membership creation with Delayed status
      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MembershipStatusType.Delayed,
          delayedStartDate: mockDepositMetadata.firstPaymentDateAfterDeposit
        })
      )

      // Verify subscription creation
      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          nextPaymentDate: mockDepositMetadata.firstPaymentDateAfterDeposit,
          remainingPayments: 1,
          status: SubscriptionStatusType.Active,
          paymentMethod: mockDepositMetadata.paymentMethodType
        })
      )
    })

    it('should throw error if product not found', async () => {
      mockRelationalFindFirst('products', undefined)

      await expect(
        handler.handleProductDepositPayment('pi_123', mockDepositMetadata as any)
      ).rejects.toThrow('Product not found')
    })
  })

  describe('handleProductInstallmentsPayment', () => {
    const mockInstallmentsMetadata = {
      type: PaymentLinkType.Installments,
      paymentProductType: PaymentProductType.Product,
      productPaymentLinkId: 'ppl_installments_123',
      productId: 'prod_123',
      customerEmail: 'customer@example.com',
      customerName: 'Test Customer',
      totalAmountToPayInCents: '600000',
      productInstallmentsCount: 12,
      productInstallmentAmountToPayInCents: '50000',
      currency: PaymentCurrencyType.RON,
      paymentMethodType: PaymentMethodType.Card
    }

    const mockPaymentIntent = {
      id: 'pi_installments_123',
      customer: 'cus_123',
      payment_method: 'pm_123'
    } as unknown as Stripe.PaymentIntent

    it('should handle Product Installments payment successfully', async () => {
      // Mock the product query
      mockRelationalFindFirst('products', {
        ...mockProduct,
        membershipDurationMonths: 12
      })

      // Mock payment link update
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      // Mock order, membership, and subscription creation
      const mockOrder = {
        id: 'order_installments_123',
        type: OrderType.ParentOrder
      }
      const mockMembership = {
        id: 'membership_active_123',
        status: MembershipStatusType.Active
      }
      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([mockMembership])
        .mockResolvedValueOnce([
          {
            id: 'subscription_123',
            status: SubscriptionStatusType.Active
          }
        ])

      await handler.handleProductInstallmentsPayment(
        mockPaymentIntent,
        mockInstallmentsMetadata as any
      )

      // Verify payment link status update
      expect(mockDatabase.update).toHaveBeenCalled()

      // Verify order creation (first call to values)
      expect(mockDatabase.values).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          type: OrderType.ParentOrder,
          status: OrderStatusType.Completed
        })
      )

      // Verify membership creation with Active status (second call to values)
      expect(mockDatabase.values).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          status: MembershipStatusType.Active,
          startDate: expect.any(String),
          endDate: expect.any(String)
        })
      )

      // Verify subscription creation with remaining payments (third call to values)
      expect(mockDatabase.values).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          remainingPayments: 11, // 12 - 1 (first installment already charged)
          status: SubscriptionStatusType.Active,
          paymentMethod: mockInstallmentsMetadata.paymentMethodType,
          productId: mockInstallmentsMetadata.productId
        })
      )
    })

    it('should throw error if product not found', async () => {
      mockRelationalFindFirst('products', undefined)

      await expect(
        handler.handleProductInstallmentsPayment(
          mockPaymentIntent,
          mockInstallmentsMetadata as any
        )
      ).rejects.toThrow('Product not found')
    })
  })

  describe('handleProductInstallmentsDepositPayment', () => {
    const mockInstallmentsDepositMetadata = {
        type: PaymentLinkType.InstallmentsDeposit,
        paymentProductType: PaymentProductType.Product,
        productPaymentLinkId: 'ppl_installments_deposit_123',
        productId: 'prod_123',
        customerEmail: 'customer@example.com',
        customerName: 'Test Customer',
        totalAmountToPayInCents: '600000',
        depositAmountInCents: '100000',
        remainingAmountToPayInCents: '500000',
        productInstallmentsCount: 12,
        productInstallmentAmountToPayInCents: '50000',
        remainingInstallmentAmountToPayInCents: '41667',
        firstPaymentDateAfterDeposit: '2024-02-01T00:00:00.000Z',
        currency: PaymentCurrencyType.RON,
        paymentMethodType: PaymentMethodType.Card
      }

    const mockPaymentIntent = {
      id: 'pi_installments_deposit_123',
      customer: 'cus_123',
      payment_method: 'pm_123'
    } as unknown as Stripe.PaymentIntent

    it('should handle Product Installments Deposit payment successfully', async () => {
      // Mock the product query
      mockRelationalFindFirst('products', {
        ...mockProduct,
        membershipDurationMonths: 12
      })

      // Mock payment link update
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      // Mock order, membership, and subscription creation
      const mockOrder = {
        id: 'order_installments_deposit_123',
        type: OrderType.ParentOrder
      }
      const mockMembership = {
        id: 'membership_delayed_123',
        status: MembershipStatusType.Delayed
      }
      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([mockMembership])
        .mockResolvedValueOnce([
          {
            id: 'subscription_123',
            status: SubscriptionStatusType.Active
          }
        ])

      await handler.handleProductInstallmentsDepositPayment(
        mockPaymentIntent,
        mockInstallmentsDepositMetadata as any
      )

      // Verify payment link status update
      expect(mockDatabase.update).toHaveBeenCalled()

      // Verify order creation (first call to values)
      expect(mockDatabase.values).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          type: OrderType.ParentOrder,
          status: OrderStatusType.Completed
        })
      )

      // Verify membership creation with Delayed status (second call to values)
      expect(mockDatabase.values).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          status: MembershipStatusType.Delayed,
          delayedStartDate:
            mockInstallmentsDepositMetadata.firstPaymentDateAfterDeposit,
          startDate: mockInstallmentsDepositMetadata.firstPaymentDateAfterDeposit,
          endDate: expect.any(String)
        })
      )

      // Verify subscription creation with full installment count (third call to values)
      expect(mockDatabase.values).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          nextPaymentDate:
            mockInstallmentsDepositMetadata.firstPaymentDateAfterDeposit,
          remainingPayments: 12, // Full count since only deposit is paid
          status: SubscriptionStatusType.Active,
          paymentMethod: mockInstallmentsDepositMetadata.paymentMethodType,
          productId: mockInstallmentsDepositMetadata.productId
        })
      )
    })

    it('should throw error if product not found', async () => {
      mockRelationalFindFirst('products', undefined)

      await expect(
        handler.handleProductInstallmentsDepositPayment(
          mockPaymentIntent,
          mockInstallmentsDepositMetadata as any
        )
      ).rejects.toThrow('Product not found')
    })
  })

  describe('updateProductPaymentLinkStatus', () => {
    it('should update payment link status successfully', async () => {
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      await handler.updateProductPaymentLinkStatus(
        'ppl_123',
        PaymentStatusType.Succeeded
      )

      expect(mockDatabase.update).toHaveBeenCalled()
      expect(mockDatabase.set).toHaveBeenCalledWith({
        status: PaymentStatusType.Succeeded
      })
      expect(mockDatabase.where).toHaveBeenCalled()
    })

    it('should handle errors when updating payment link status', async () => {
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockImplementation(() => {
        throw new Error('Database error')
      })

      await expect(
        handler.updateProductPaymentLinkStatus(
          'ppl_123',
          PaymentStatusType.Succeeded
        )
      ).rejects.toThrow(
        'StripeProductHandlers updateProductPaymentLinkStatus error'
      )
    })
  })
})
