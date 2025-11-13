import type { extension_orders } from '~/server/database/schema'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'

type ExtensionOrder = typeof extension_orders.$inferSelect

/**
 * Test fixture data for extension orders
 */

export const mockExtensionParentOrder: ExtensionOrder = {
  id: 'ext_order_parent_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  extensionPaymentLinkId: 'epl_integral_123',
  membershipId: 'membership_active_123',
  status: OrderStatusType.Completed,
  stripePaymentIntentId: 'pi_mock_ext_123',
  type: OrderType.ParentOrder,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockExtensionRenewalOrder: ExtensionOrder = {
  id: 'ext_order_renewal_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  extensionPaymentLinkId: 'epl_deposit_123',
  membershipId: 'membership_active_123',
  status: OrderStatusType.Completed,
  stripePaymentIntentId: 'pi_mock_ext_renewal_123',
  type: OrderType.RenewalOrder,
  createdAt: '2024-02-01T00:00:00.000Z',
  updatedAt: '2024-02-01T00:00:00.000Z',
  deletedAt: null
}

export const mockExtensionOneTimeOrder: ExtensionOrder = {
  id: 'ext_order_onetime_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  extensionPaymentLinkId: 'epl_integral_123',
  membershipId: 'membership_active_123',
  status: OrderStatusType.Completed,
  stripePaymentIntentId: 'pi_mock_ext_onetime_123',
  type: OrderType.OneTimePaymentOrder,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const createMockExtensionOrder = (
  overrides?: Partial<ExtensionOrder>
): ExtensionOrder => ({
  ...mockExtensionParentOrder,
  ...overrides
})
