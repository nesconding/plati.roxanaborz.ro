import type { memberships } from '~/server/database/schema'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'

type Membership = typeof memberships.$inferSelect

/**
 * Test fixture data for memberships
 */

export const mockActiveMembership: Membership = {
  id: 'membership_active_123',
  delayedStartDate: null,
  endDate: '2025-01-01T00:00:00.000Z',
  parentOrderId: 'order_parent_123',
  startDate: '2024-01-01T00:00:00.000Z',
  status: MembershipStatusType.Active,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockDelayedMembership: Membership = {
  id: 'membership_delayed_123',
  delayedStartDate: '2024-02-01T00:00:00.000Z',
  endDate: '2025-02-01T00:00:00.000Z',
  parentOrderId: 'order_parent_delayed_123',
  startDate: '2024-01-01T00:00:00.000Z',
  status: MembershipStatusType.Delayed,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null
}

export const mockPausedMembership: Membership = {
  id: 'membership_paused_123',
  delayedStartDate: null,
  endDate: '2025-01-01T00:00:00.000Z',
  parentOrderId: 'order_parent_paused_123',
  startDate: '2024-01-01T00:00:00.000Z',
  status: MembershipStatusType.Paused,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  deletedAt: null
}

export const mockCancelledMembership: Membership = {
  id: 'membership_cancelled_123',
  delayedStartDate: null,
  endDate: '2025-01-01T00:00:00.000Z',
  parentOrderId: 'order_parent_cancelled_123',
  startDate: '2024-01-01T00:00:00.000Z',
  status: MembershipStatusType.Cancelled,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  deletedAt: null
}

export const createMockMembership = (
  overrides?: Partial<Membership>
): Membership => ({
  ...mockActiveMembership,
  ...overrides
})
