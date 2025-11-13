import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StripeExtensionHandlers } from '../stripe-extension-handlers'
import type Stripe from 'stripe'
import {
  mockDatabase,
  resetDatabaseMocks,
  mockRelationalFindFirst,
  mockRelationalFindMany
} from '#test/mocks/database'
import { mockProductExtension } from '#test/fixtures/products'
import { mockActiveMembership } from '#test/fixtures/memberships'
import { mockExtensionParentOrder } from '#test/fixtures/extension-orders'
import {
  mockExtensionPaymentLinkIntegral,
  mockExtensionPaymentLinkDeposit
} from '#test/fixtures/payment-links'
import { mockActiveExtensionSubscription } from '#test/fixtures/extension-subscriptions'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentCurrencyType } from '~/shared/enums/payment-currency-type'
import { StripeService } from '~/server/services/stripe'
import type {
  PaymentIntentExtensionIntegralMetadata,
  PaymentIntentExtensionDepositMetadata
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
      isAfter: vi.fn((date1: Date, date2: Date) => date1 > date2),
      startOfDay: vi.fn((date: Date | string) => {
        const result = new Date(date)
        result.setHours(0, 0, 0, 0)
        return result
      }),
      endOfDay: vi.fn((date: Date | string) => {
        const result = new Date(date)
        result.setHours(23, 59, 59, 999)
        return result
      })
    }
  }
})

// Mock the StripeService
vi.mock('~/server/services/stripe', () => {
  return {
    StripeService: {
      findPaymentIntentById: vi.fn(),
      chargeDeferredPayment: vi.fn()
    }
  }
})

describe('StripeExtensionHandlers', () => {
  let handler: StripeExtensionHandlers

  beforeEach(() => {
    resetDatabaseMocks()
    vi.clearAllMocks()
    // @ts-expect-error - mockDatabase is a partial mock
    handler = new StripeExtensionHandlers(mockDatabase)
  })

  describe('handleExtensionIntegralPayment', () => {
    const mockIntegralMetadata = {
      type: PaymentLinkType.Integral,
      paymentProductType: PaymentProductType.Extension,
      extensionPaymentLinkId: 'epl_integral_123',
      extensionId: 'ext_123',
      membershipId: 'membership_active_123',
      customerEmail: 'customer@example.com',
      customerName: 'Test Customer',
      totalAmountToPayInCents: '50000',
      currency: PaymentCurrencyType.RON,
      paymentMethodType: PaymentMethodType.Card
    }

    it('should handle Extension Integral payment successfully', async () => {
      // Mock the extension and membership queries
      mockRelationalFindFirst('products_extensions', {
        ...mockProductExtension,
        extensionMonths: 12
      })
      mockRelationalFindFirst('memberships', {
        ...mockActiveMembership,
        endDate: '2025-01-01T00:00:00.000Z'
      })

      // Mock database operations
      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([
        {
          id: 'ext_order_123',
          type: OrderType.OneTimePaymentOrder
        }
      ])

      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      await handler.handleExtensionIntegralPayment(
        'pi_ext_123',
        mockIntegralMetadata as any
      )

      // Verify extension order creation
      expect(mockDatabase.insert).toHaveBeenCalled()
      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: mockIntegralMetadata.customerEmail,
          customerName: mockIntegralMetadata.customerName,
          extensionPaymentLinkId: mockIntegralMetadata.extensionPaymentLinkId,
          membershipId: mockIntegralMetadata.membershipId,
          status: OrderStatusType.Completed,
          stripePaymentIntentId: 'pi_ext_123',
          type: OrderType.OneTimePaymentOrder
        })
      )

      // Verify membership end date was extended
      expect(mockDatabase.update).toHaveBeenCalled()
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          endDate: expect.any(String)
        })
      )
    })

    it('should throw error if extension not found', async () => {
      mockRelationalFindFirst('products_extensions', undefined)
      mockRelationalFindFirst('memberships', mockActiveMembership)

      await expect(
        handler.handleExtensionIntegralPayment('pi_123', mockIntegralMetadata as any)
      ).rejects.toThrow('Extension not found')
    })

    it('should throw error if membership not found', async () => {
      mockRelationalFindFirst('products_extensions', mockProductExtension)
      mockRelationalFindFirst('memberships', undefined)

      await expect(
        handler.handleExtensionIntegralPayment('pi_123', mockIntegralMetadata as any)
      ).rejects.toThrow('Membership not found')
    })
  })

  describe('handleExtensionDepositPayment', () => {
    const mockDepositMetadata = {
      type: PaymentLinkType.Deposit,
      paymentProductType: PaymentProductType.Extension,
      extensionPaymentLinkId: 'epl_deposit_123',
      extensionId: 'ext_123',
      membershipId: 'membership_active_123',
      customerEmail: 'customer@example.com',
      customerName: 'Test Customer',
      totalAmountToPayInCents: '50000',
      depositAmountInCents: '10000',
      remainingAmountToPayInCents: '40000',
      firstPaymentDateAfterDeposit: '2024-02-01T00:00:00.000Z',
      currency: PaymentCurrencyType.RON,
      paymentMethodType: PaymentMethodType.Card
    }

    it('should handle Extension Deposit payment successfully', async () => {
      // Mock extension query
      mockRelationalFindFirst('products_extensions', mockProductExtension)

      // Mock database operations
      const mockOrder = {
        id: 'ext_order_deposit_123',
        type: OrderType.ParentOrder
      }

      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning
        .mockResolvedValueOnce([mockOrder])
        .mockResolvedValueOnce([
          {
            id: 'ext_subscription_123',
            status: SubscriptionStatusType.Active
          }
        ])

      await handler.handleExtensionDepositPayment(
        'pi_ext_deposit_123',
        mockDepositMetadata as any
      )

      // Verify extension order creation with ParentOrder type
      expect(mockDatabase.values).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          customerEmail: mockDepositMetadata.customerEmail,
          customerName: mockDepositMetadata.customerName,
          extensionPaymentLinkId: mockDepositMetadata.extensionPaymentLinkId,
          membershipId: mockDepositMetadata.membershipId,
          status: OrderStatusType.Completed,
          type: OrderType.ParentOrder
        })
      )

      // Verify subscription creation
      expect(mockDatabase.values).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          customerEmail: mockDepositMetadata.customerEmail,
          customerName: mockDepositMetadata.customerName,
          extensionId: mockDepositMetadata.extensionId,
          membershipId: mockDepositMetadata.membershipId,
          nextPaymentDate: mockDepositMetadata.firstPaymentDateAfterDeposit,
          remainingPayments: 1,
          status: SubscriptionStatusType.Active,
          paymentMethod: mockDepositMetadata.paymentMethodType
        })
      )
    })

    it('should throw error if extension not found', async () => {
      mockRelationalFindFirst('products_extensions', undefined)

      await expect(
        handler.handleExtensionDepositPayment('pi_123', mockDepositMetadata as any)
      ).rejects.toThrow('Extension not found')
    })
  })

  describe('handleChargeDeferredExtensionPayments', () => {
    it('should charge deferred extension payment successfully', async () => {
      const mockExtension = {
        ...mockProductExtension,
        extensionMonths: 12
      }

      const mockMembership = {
        ...mockActiveMembership,
        endDate: '2025-01-01T00:00:00.000Z'
      }

      const mockSubscriptionWithRelations = {
        ...mockActiveExtensionSubscription,
        id: 'ext_subscription_deposit_123',
        membershipId: 'membership_active_123',
        remainingPayments: 1,
        nextPaymentDate: '2024-01-15T10:00:00.000Z',
        membership: mockMembership,
        parentOrder: {
          ...mockExtensionParentOrder,
          stripePaymentIntentId: 'pi_ext_deposit_parent_123',
          extensionPaymentLink: {
            ...mockExtensionPaymentLinkDeposit,
            extension: mockExtension
          }
        }
      }

      mockRelationalFindMany('extension_subscriptions', [
        mockSubscriptionWithRelations
      ])

      // Mock StripeService calls
      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_ext_deposit_parent_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Deposit,
          extensionPaymentLinkId: 'epl_deposit_123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
          remainingAmountToPayInCents: '40000'
        }
      } as unknown as Stripe.PaymentIntent)

      ;(StripeService.chargeDeferredPayment as any).mockResolvedValue({
        id: 'pi_ext_deferred_payment_123'
      } as unknown as Stripe.PaymentIntent)

      // Mock database operations
      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([
        {
          id: 'ext_order_renewal_123'
        }
      ])

      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      const result = await handler.handleChargeDeferredExtensionPayments()

      expect(result.processedCount).toBe(1)
      expect(result.successCount).toBe(1)
      expect(result.errors).toHaveLength(0)

      // Verify StripeService was called
      expect(StripeService.findPaymentIntentById).toHaveBeenCalledWith(
        'pi_ext_deposit_parent_123'
      )
      expect(StripeService.chargeDeferredPayment).toHaveBeenCalled()

      // Verify renewal order was created
      expect(mockDatabase.insert).toHaveBeenCalled()
      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: OrderType.RenewalOrder,
          status: OrderStatusType.Completed
        })
      )

      // Verify subscription was completed
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatusType.Completed,
          remainingPayments: 0,
          nextPaymentDate: null
        })
      )

      // Verify membership was activated
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MembershipStatusType.Active
        })
      )

      // Verify membership end date was extended
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          endDate: expect.any(String)
        })
      )
    })

    it('should handle payment failure and put subscription on hold', async () => {
      const mockExtension = {
        ...mockProductExtension,
        extensionMonths: 12
      }

      const mockMembership = {
        ...mockActiveMembership,
        id: 'membership_123',
        endDate: '2025-01-01T00:00:00.000Z'
      }

      const mockSubscriptionWithRelations = {
        ...mockActiveExtensionSubscription,
        id: 'ext_subscription_fail_123',
        membershipId: 'membership_123',
        remainingPayments: 1,
        membership: mockMembership,
        parentOrder: {
          ...mockExtensionParentOrder,
          stripePaymentIntentId: 'pi_ext_fail_123',
          extensionPaymentLink: {
            ...mockExtensionPaymentLinkDeposit,
            extension: mockExtension
          }
        }
      }

      mockRelationalFindMany('extension_subscriptions', [
        mockSubscriptionWithRelations
      ])

      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_ext_fail_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Deposit,
          remainingAmountToPayInCents: '40000'
        }
      } as unknown as Stripe.PaymentIntent)

      // Mock payment failure
      ;(StripeService.chargeDeferredPayment as any).mockRejectedValue(
        new Error('Payment failed')
      )

      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      const result = await handler.handleChargeDeferredExtensionPayments()

      expect(result.processedCount).toBe(1)
      expect(result.successCount).toBe(0)
      expect(result.errors).toHaveLength(1)

      // Verify subscription was put on hold
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatusType.OnHold
        })
      )
    })

    it('should pause membership if payment fails after membership expires', async () => {
      const now = new Date('2024-01-15T10:00:00.000Z')
      const expiredMembership = {
        ...mockActiveMembership,
        id: 'membership_expired_123',
        endDate: '2024-01-14T00:00:00.000Z' // Expired yesterday
      }

      const mockExtension = {
        ...mockProductExtension,
        extensionMonths: 12
      }

      const mockSubscriptionWithRelations = {
        ...mockActiveExtensionSubscription,
        id: 'ext_subscription_expired_123',
        membershipId: 'membership_expired_123',
        membership: expiredMembership,
        parentOrder: {
          ...mockExtensionParentOrder,
          extensionPaymentLink: {
            ...mockExtensionPaymentLinkDeposit,
            extension: mockExtension
          }
        }
      }

      mockRelationalFindMany('extension_subscriptions', [
        mockSubscriptionWithRelations
      ])

      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Deposit,
          remainingAmountToPayInCents: '40000'
        }
      } as unknown as Stripe.PaymentIntent)

      ;(StripeService.chargeDeferredPayment as any).mockRejectedValue(
        new Error('Payment failed')
      )

      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      await handler.handleChargeDeferredExtensionPayments()

      // Verify membership was paused (because it's expired)
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MembershipStatusType.Paused
        })
      )
    })
  })

  describe('updateExtensionPaymentLinkStatus', () => {
    it('should update extension payment link status successfully', async () => {
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      await handler.updateExtensionPaymentLinkStatus(
        'epl_123',
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
        handler.updateExtensionPaymentLinkStatus(
          'epl_123',
          PaymentStatusType.Succeeded
        )
      ).rejects.toThrow(
        'StripeExtensionHandlers updateExtensionPaymentLinkStatus error'
      )
    })
  })
})
