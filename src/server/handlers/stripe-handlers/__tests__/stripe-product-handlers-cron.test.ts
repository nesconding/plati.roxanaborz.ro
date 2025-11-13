import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StripeProductHandlers } from '../stripe-product-handlers'
import {
  mockDatabase,
  resetDatabaseMocks,
  mockRelationalFindMany
} from '#test/mocks/database'
import {
  mockActiveSubscription,
  createMockSubscription
} from '#test/fixtures/subscriptions'
import { mockActiveMembership } from '#test/fixtures/memberships'
import { mockParentOrder } from '#test/fixtures/orders'
import { mockProductPaymentLinkDeposit, mockProductPaymentLinkInstallments } from '#test/fixtures/payment-links'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'
import { StripeService } from '~/server/services/stripe'
import type Stripe from 'stripe'

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
      findPaymentIntentById: vi.fn(),
      chargeDeferredPayment: vi.fn(),
      chargeInstallmentPayment: vi.fn()
    }
  }
})

describe('StripeProductHandlers - Cron Jobs', () => {
  let handler: StripeProductHandlers

  beforeEach(() => {
    resetDatabaseMocks()
    vi.clearAllMocks()
    // @ts-expect-error - mockDatabase is a partial mock
    handler = new StripeProductHandlers(mockDatabase)
  })

  describe('handleChargeDeferredProductPayments', () => {
    it('should charge deferred payment for Product Deposit successfully', async () => {
      // Mock subscription with parent order and payment link
      const mockSubscriptionWithRelations = {
        ...mockActiveSubscription,
        id: 'subscription_deposit_123',
        remainingPayments: 1,
        nextPaymentDate: '2024-01-15T10:00:00.000Z',
        membership: mockActiveMembership,
        parentOrder: {
          ...mockParentOrder,
          stripePaymentIntentId: 'pi_deposit_parent_123',
          productPaymentLink: {
            ...mockProductPaymentLinkDeposit,
            type: PaymentLinkType.Deposit
          }
        }
      }

      // Mock finding subscriptions due
      mockRelationalFindMany('product_subscriptions', [
        mockSubscriptionWithRelations
      ])

      // Mock StripeService calls
      const mockOriginalPI = {
        id: 'pi_deposit_parent_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Deposit,
          productPaymentLinkId: 'ppl_deposit_123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
          remainingAmountToPayInCents: '400000'
        }
      } as unknown as Stripe.PaymentIntent

      const mockNewPI = {
        id: 'pi_deferred_payment_123'
      } as unknown as Stripe.PaymentIntent

      ;(StripeService.findPaymentIntentById as any).mockResolvedValue(
        mockOriginalPI
      )
      ;(StripeService.chargeDeferredPayment as any).mockResolvedValue(mockNewPI)

      // Mock database operations
      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([
        {
          id: 'order_renewal_123',
          type: OrderType.RenewalOrder
        }
      ])

      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      const result = await handler.handleChargeDeferredProductPayments()

      // Verify results
      expect(result.processedCount).toBe(1)
      expect(result.successCount).toBe(1)
      expect(result.errors).toHaveLength(0)

      // Verify StripeService was called
      expect(StripeService.findPaymentIntentById).toHaveBeenCalledWith(
        'pi_deposit_parent_123'
      )
      expect(StripeService.chargeDeferredPayment).toHaveBeenCalled()

      // Verify renewal order was created
      expect(mockDatabase.insert).toHaveBeenCalled()
      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: OrderType.RenewalOrder,
          status: OrderStatusType.Completed,
          stripePaymentIntentId: 'pi_deferred_payment_123'
        })
      )

      // Verify subscription was completed (remainingPayments was 1, now 0)
      expect(mockDatabase.update).toHaveBeenCalled()
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
    })

    it('should handle multiple subscriptions due for payment', async () => {
      const mockSubscriptions = [
        {
          ...mockActiveSubscription,
          id: 'subscription_1',
          remainingPayments: 1,
          membership: mockActiveMembership,
          parentOrder: {
            ...mockParentOrder,
            id: 'order_1',
            stripePaymentIntentId: 'pi_1',
            productPaymentLink: {
              ...mockProductPaymentLinkDeposit,
              type: PaymentLinkType.Deposit
            }
          }
        },
        {
          ...mockActiveSubscription,
          id: 'subscription_2',
          remainingPayments: 1,
          membership: { ...mockActiveMembership, id: 'membership_2' },
          parentOrder: {
            ...mockParentOrder,
            id: 'order_2',
            stripePaymentIntentId: 'pi_2',
            productPaymentLink: {
              ...mockProductPaymentLinkDeposit,
              type: PaymentLinkType.Deposit
            }
          }
        }
      ]

      mockRelationalFindMany('product_subscriptions', mockSubscriptions)

      // Mock StripeService calls
      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Deposit,
          remainingAmountToPayInCents: '400000',
          productPaymentLinkId: 'ppl_123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer'
        }
      } as unknown as Stripe.PaymentIntent)

      ;(StripeService.chargeDeferredPayment as any).mockResolvedValue({
        id: 'pi_new_123'
      } as unknown as Stripe.PaymentIntent)

      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([{ id: 'order_123' }])
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      const result = await handler.handleChargeDeferredProductPayments()

      expect(result.processedCount).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle payment failures and put subscription on hold', async () => {
      const mockSubscriptionWithRelations = {
        ...mockActiveSubscription,
        id: 'subscription_fail_123',
        membershipId: 'membership_123',
        remainingPayments: 1,
        membership: mockActiveMembership,
        parentOrder: {
          ...mockParentOrder,
          stripePaymentIntentId: 'pi_fail_123',
          productPaymentLink: {
            ...mockProductPaymentLinkDeposit,
            type: PaymentLinkType.Deposit
          }
        }
      }

      mockRelationalFindMany('product_subscriptions', [
        mockSubscriptionWithRelations
      ])

      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_fail_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Deposit,
          remainingAmountToPayInCents: '400000'
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

      const result = await handler.handleChargeDeferredProductPayments()

      expect(result.processedCount).toBe(1)
      expect(result.successCount).toBe(0)
      expect(result.errors).toHaveLength(1)

      // Verify subscription was put on hold
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatusType.OnHold
        })
      )

      // Verify membership was paused
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MembershipStatusType.Paused
        })
      )
    })

    it('should filter out Installments subscriptions (only process Deposit)', async () => {
      const mockSubscriptions = [
        {
          ...mockActiveSubscription,
          id: 'subscription_deposit',
          parentOrder: {
            ...mockParentOrder,
            productPaymentLink: {
              ...mockProductPaymentLinkDeposit,
              type: PaymentLinkType.Deposit
            }
          }
        },
        {
          ...mockActiveSubscription,
          id: 'subscription_installments',
          parentOrder: {
            ...mockParentOrder,
            productPaymentLink: {
              ...mockProductPaymentLinkInstallments,
              type: PaymentLinkType.Installments
            }
          }
        }
      ]

      mockRelationalFindMany('product_subscriptions', mockSubscriptions)

      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Deposit,
          remainingAmountToPayInCents: '400000',
          productPaymentLinkId: 'ppl_123',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer'
        }
      } as unknown as Stripe.PaymentIntent)

      ;(StripeService.chargeDeferredPayment as any).mockResolvedValue({
        id: 'pi_new'
      } as unknown as Stripe.PaymentIntent)

      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([{ id: 'order_123' }])
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      const result = await handler.handleChargeDeferredProductPayments()

      // Only 1 subscription should be processed (the Deposit one)
      expect(result.processedCount).toBe(1)
      expect(result.successCount).toBe(1)
    })
  })

  describe('handleChargeProductInstallmentsPayments', () => {
    it('should charge installment payment successfully', async () => {
      const mockSubscriptionWithRelations = {
        ...createMockSubscription({
          id: 'subscription_installments_123',
          remainingPayments: 11,
          nextPaymentDate: '2024-01-15T10:00:00.000Z'
        }),
        membership: mockActiveMembership,
        parentOrder: {
          ...mockParentOrder,
          stripePaymentIntentId: 'pi_installments_parent_123',
          productPaymentLink: {
            ...mockProductPaymentLinkInstallments,
            type: PaymentLinkType.Installments
          }
        }
      }

      mockRelationalFindMany('product_subscriptions', [
        mockSubscriptionWithRelations
      ])

      // Mock StripeService calls
      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_installments_parent_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Installments,
          productInstallmentAmountToPayInCents: '50000'
        }
      } as unknown as Stripe.PaymentIntent)

      ;(StripeService.chargeInstallmentPayment as any).mockResolvedValue({
        id: 'pi_installment_payment_123'
      } as unknown as Stripe.PaymentIntent)

      // Mock database operations
      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([
        {
          id: 'order_renewal_123'
        }
      ])

      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      const result = await handler.handleChargeProductInstallmentsPayments()

      expect(result.processedCount).toBe(1)
      expect(result.successCount).toBe(1)
      expect(result.errors).toHaveLength(0)

      // Verify StripeService was called
      expect(StripeService.chargeInstallmentPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cus_123',
          paymentMethodId: 'pm_123',
          priceAmountInCents: 50000
        })
      )

      // Verify renewal order was created
      expect(mockDatabase.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: OrderType.RenewalOrder,
          status: OrderStatusType.Completed
        })
      )

      // Verify subscription was updated (remainingPayments decremented)
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          remainingPayments: 10,
          nextPaymentDate: expect.any(String)
        })
      )
    })

    it('should complete subscription when final installment is charged', async () => {
      const mockSubscriptionWithRelations = {
        ...createMockSubscription({
          id: 'subscription_final_123',
          remainingPayments: 1 // Final payment
        }),
        membership: mockActiveMembership,
        parentOrder: {
          ...mockParentOrder,
          stripePaymentIntentId: 'pi_final_123',
          productPaymentLink: {
            ...mockProductPaymentLinkInstallments,
            type: PaymentLinkType.Installments
          }
        }
      }

      mockRelationalFindMany('product_subscriptions', [
        mockSubscriptionWithRelations
      ])

      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_final_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Installments,
          productInstallmentAmountToPayInCents: '50000'
        }
      } as unknown as Stripe.PaymentIntent)

      ;(StripeService.chargeInstallmentPayment as any).mockResolvedValue({
        id: 'pi_final_payment'
      } as unknown as Stripe.PaymentIntent)

      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([{ id: 'order_123' }])
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      const result = await handler.handleChargeProductInstallmentsPayments()

      expect(result.successCount).toBe(1)

      // Verify subscription was completed
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatusType.Completed,
          remainingPayments: 0,
          nextPaymentDate: null
        })
      )
    })

    it('should activate delayed membership on first installment after deposit', async () => {
      const mockDelayedMembership = {
        ...mockActiveMembership,
        id: 'membership_delayed_123',
        status: MembershipStatusType.Delayed
      }

      const mockSubscriptionWithRelations = {
        ...createMockSubscription({
          id: 'subscription_delayed_123',
          membershipId: 'membership_delayed_123',
          remainingPayments: 12
        }),
        membership: mockDelayedMembership,
        parentOrder: {
          ...mockParentOrder,
          stripePaymentIntentId: 'pi_delayed_123',
          productPaymentLink: {
            ...mockProductPaymentLinkInstallments,
            type: PaymentLinkType.InstallmentsDeposit
          }
        }
      }

      mockRelationalFindMany('product_subscriptions', [
        mockSubscriptionWithRelations
      ])

      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_delayed_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.InstallmentsDeposit,
          productInstallmentAmountToPayInCents: '50000',
          remainingInstallmentAmountToPayInCents: '41667'
        }
      } as unknown as Stripe.PaymentIntent)

      ;(StripeService.chargeInstallmentPayment as any).mockResolvedValue({
        id: 'pi_activate_membership'
      } as unknown as Stripe.PaymentIntent)

      mockDatabase.insert.mockReturnThis()
      mockDatabase.values.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([{ id: 'order_123' }])
      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      await handler.handleChargeProductInstallmentsPayments()

      // Verify membership was activated (changed from Delayed to Active)
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MembershipStatusType.Active
        })
      )
    })

    it('should handle installment payment failure', async () => {
      const mockSubscriptionWithRelations = {
        ...createMockSubscription({
          id: 'subscription_fail_123',
          membershipId: 'membership_123',
          remainingPayments: 10
        }),
        membership: mockActiveMembership,
        parentOrder: {
          ...mockParentOrder,
          stripePaymentIntentId: 'pi_fail_123',
          productPaymentLink: {
            ...mockProductPaymentLinkInstallments,
            type: PaymentLinkType.Installments
          }
        }
      }

      mockRelationalFindMany('product_subscriptions', [
        mockSubscriptionWithRelations
      ])

      ;(StripeService.findPaymentIntentById as any).mockResolvedValue({
        id: 'pi_fail_123',
        customer: 'cus_123',
        payment_method: 'pm_123',
        metadata: {
          type: PaymentLinkType.Installments,
          productInstallmentAmountToPayInCents: '50000'
        }
      } as unknown as Stripe.PaymentIntent)

      // Mock payment failure
      ;(StripeService.chargeInstallmentPayment as any).mockRejectedValue(
        new Error('Payment failed')
      )

      mockDatabase.update.mockReturnThis()
      mockDatabase.set.mockReturnThis()
      mockDatabase.where.mockReturnThis()
      mockDatabase.returning.mockResolvedValue([])

      const result = await handler.handleChargeProductInstallmentsPayments()

      expect(result.processedCount).toBe(1)
      expect(result.successCount).toBe(0)
      expect(result.errors).toHaveLength(1)

      // Verify subscription was put on hold
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatusType.OnHold
        })
      )

      // Verify membership was paused
      expect(mockDatabase.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: MembershipStatusType.Paused
        })
      )
    })
  })
})
