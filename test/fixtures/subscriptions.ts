import type { product_subscriptions } from '~/server/database/schema'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'

type Subscription = typeof product_subscriptions.$inferSelect

/**
 * Test fixture data for product subscriptions
 */

export const mockActiveSubscription: Subscription = {
  id: 'subscription_active_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  membershipId: 'membership_active_123',
  nextPaymentDate: '2024-02-01T00:00:00.000Z',
  parentOrderId: 'order_parent_123',
  paymentMethod: PaymentMethodType.Card,
  productId: 'prod_123',
  remainingPayments: 11,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.Active,
  updatePaymentToken: null,
  updatePaymentTokenExpiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockSubscriptionWithDeposit: Subscription = {
  id: 'subscription_deposit_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  membershipId: 'membership_active_123',
  nextPaymentDate: '2024-02-01T00:00:00.000Z',
  parentOrderId: 'order_parent_123',
  paymentMethod: PaymentMethodType.Card,
  productId: 'prod_123',
  remainingPayments: 1,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.Active,
  updatePaymentToken: null,
  updatePaymentTokenExpiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockSubscriptionWithInstallments: Subscription = {
  id: 'subscription_installments_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  membershipId: 'membership_active_123',
  nextPaymentDate: '2024-02-01T00:00:00.000Z',
  parentOrderId: 'order_parent_123',
  paymentMethod: PaymentMethodType.Card,
  productId: 'prod_123',
  remainingPayments: 12,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.Active,
  updatePaymentToken: null,
  updatePaymentTokenExpiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockOnHoldSubscription: Subscription = {
  id: 'subscription_onhold_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  membershipId: 'membership_active_123',
  nextPaymentDate: null,
  parentOrderId: 'order_parent_123',
  paymentMethod: PaymentMethodType.Card,
  productId: 'prod_123',
  remainingPayments: 8,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.OnHold,
  updatePaymentToken: 'token_update_123',
  updatePaymentTokenExpiresAt: '2024-02-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  deletedAt: null
}

export const mockCancelledSubscription: Subscription = {
  id: 'subscription_cancelled_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  membershipId: 'membership_cancelled_123',
  nextPaymentDate: null,
  parentOrderId: 'order_parent_123',
  paymentMethod: PaymentMethodType.Card,
  productId: 'prod_123',
  remainingPayments: 5,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.Cancelled,
  updatePaymentToken: null,
  updatePaymentTokenExpiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  deletedAt: null
}

export const mockCompletedSubscription: Subscription = {
  id: 'subscription_completed_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  membershipId: 'membership_active_123',
  nextPaymentDate: null,
  parentOrderId: 'order_parent_123',
  paymentMethod: PaymentMethodType.Card,
  productId: 'prod_123',
  remainingPayments: 0,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.Completed,
  updatePaymentToken: null,
  updatePaymentTokenExpiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-12-01T00:00:00.000Z',
  deletedAt: null
}

export const mockBankTransferSubscription: Subscription = {
  id: 'subscription_bank_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  membershipId: 'membership_active_123',
  nextPaymentDate: '2024-02-01T00:00:00.000Z',
  parentOrderId: 'order_parent_123',
  paymentMethod: PaymentMethodType.BankTransfer,
  productId: 'prod_123',
  remainingPayments: 12,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.Active,
  updatePaymentToken: null,
  updatePaymentTokenExpiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const createMockSubscription = (
  overrides?: Partial<Subscription>
): Subscription => ({
  ...mockActiveSubscription,
  ...overrides
})
