import type { product_orders } from '~/server/database/schema'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'

type Order = typeof product_orders.$inferSelect

/**
 * Test fixture data for product orders
 */

export const mockParentOrder: Order = {
  id: 'order_parent_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  productPaymentLinkId: 'ppl_integral_123',
  status: OrderStatusType.Completed,
  stripePaymentIntentId: 'pi_mock_123',
  type: OrderType.ParentOrder,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockRenewalOrder: Order = {
  id: 'order_renewal_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  productPaymentLinkId: 'ppl_installments_123',
  status: OrderStatusType.Completed,
  stripePaymentIntentId: 'pi_mock_renewal_123',
  type: OrderType.RenewalOrder,
  createdAt: '2024-02-01T00:00:00.000Z',
  updatedAt: '2024-02-01T00:00:00.000Z',
  deletedAt: null
}

export const mockOneTimePaymentOrder: Order = {
  id: 'order_onetime_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  productPaymentLinkId: 'ppl_integral_123',
  status: OrderStatusType.Completed,
  stripePaymentIntentId: 'pi_mock_onetime_123',
  type: OrderType.OneTimePaymentOrder,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockPendingCardPaymentOrder: Order = {
  id: 'order_pending_card_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  productPaymentLinkId: 'ppl_deposit_123',
  status: OrderStatusType.PendingCardPayment,
  stripePaymentIntentId: 'pi_mock_pending_123',
  type: OrderType.ParentOrder,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockPendingCardPaymentOrder2: Order = {
  id: 'order_pending_card_2_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  productPaymentLinkId: 'ppl_deposit_123',
  status: OrderStatusType.PendingCardPayment,
  stripePaymentIntentId: 'pi_mock_pending_card_2_123',
  type: OrderType.ParentOrder,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockCancelledOrder: Order = {
  id: 'order_cancelled_123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  productPaymentLinkId: 'ppl_integral_123',
  status: OrderStatusType.Cancelled,
  stripePaymentIntentId: 'pi_mock_cancelled_123',
  type: OrderType.ParentOrder,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  deletedAt: null
}

export const createMockOrder = (overrides?: Partial<Order>): Order => ({
  ...mockParentOrder,
  ...overrides
})
