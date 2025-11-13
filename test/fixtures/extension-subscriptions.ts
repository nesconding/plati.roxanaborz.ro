import type { extension_subscriptions } from '~/server/database/schema'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'

type ExtensionSubscription = typeof extension_subscriptions.$inferSelect

/**
 * Test fixture data for extension subscriptions
 */

export const mockActiveExtensionSubscription: ExtensionSubscription = {
  id: 'ext_subscription_active_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  extensionId: 'ext_123',
  membershipId: 'membership_active_123',
  nextPaymentDate: '2024-02-01T00:00:00.000Z',
  parentOrderId: 'ext_order_parent_123',
  paymentMethod: PaymentMethodType.Card,
  remainingPayments: 1,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.Active,
  stripeSubscriptionId: null,
  stripeSubscriptionScheduleId: null,
  updatePaymentToken: null,
  updatePaymentTokenExpiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockExtensionSubscriptionWithDeposit: ExtensionSubscription = {
  id: 'ext_subscription_deposit_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  extensionId: 'ext_123',
  membershipId: 'membership_active_123',
  nextPaymentDate: '2024-02-01T00:00:00.000Z',
  parentOrderId: 'ext_order_parent_123',
  paymentMethod: PaymentMethodType.Card,
  remainingPayments: 1,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.Active,
  stripeSubscriptionId: null,
  stripeSubscriptionScheduleId: null,
  updatePaymentToken: null,
  updatePaymentTokenExpiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockOnHoldExtensionSubscription: ExtensionSubscription = {
  id: 'ext_subscription_onhold_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  extensionId: 'ext_123',
  membershipId: 'membership_active_123',
  nextPaymentDate: null,
  parentOrderId: 'ext_order_parent_123',
  paymentMethod: PaymentMethodType.Card,
  remainingPayments: 1,
  startDate: '2024-01-01T00:00:00.000Z',
  status: SubscriptionStatusType.OnHold,
  stripeSubscriptionId: null,
  stripeSubscriptionScheduleId: null,
  updatePaymentToken: 'token_update_123',
  updatePaymentTokenExpiresAt: '2024-02-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  deletedAt: null
}

export const createMockExtensionSubscription = (
  overrides?: Partial<ExtensionSubscription>
): ExtensionSubscription => ({
  ...mockActiveExtensionSubscription,
  ...overrides
})
