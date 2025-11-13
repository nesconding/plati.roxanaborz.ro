import type { users } from '~/server/database/schema'
import { UserRoles } from '~/shared/enums/user-roles'

type User = typeof users.$inferSelect

/**
 * Test fixture data for users
 */

export const mockAdminUser: User = {
  id: 'user_admin_123',
  email: 'admin@example.com',
  emailVerified: true,
  name: 'Admin User',
  firstName: 'Admin',
  lastName: 'User',
  image: null,
  phoneNumber: null,
  phoneNumberVerified: false,
  invitedById: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  role: UserRoles.SUPER_ADMIN,
  banned: false,
  banReason: null,
  banExpires: null
}

export const mockRegularUser: User = {
  id: 'user_regular_123',
  email: 'user@example.com',
  emailVerified: true,
  name: 'Regular User',
  firstName: 'Regular',
  lastName: 'User',
  image: null,
  phoneNumber: null,
  phoneNumberVerified: false,
  invitedById: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  role: UserRoles.USER,
  banned: false,
  banReason: null,
  banExpires: null
}

export const mockUnverifiedUser: User = {
  id: 'user_unverified_123',
  email: 'unverified@example.com',
  emailVerified: false,
  name: 'Unverified User',
  firstName: 'Unverified',
  lastName: 'User',
  image: null,
  phoneNumber: null,
  phoneNumberVerified: false,
  invitedById: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  role: UserRoles.USER,
  banned: false,
  banReason: null,
  banExpires: null
}

export const mockBannedUser: User = {
  id: 'user_banned_123',
  email: 'banned@example.com',
  emailVerified: true,
  name: 'Banned User',
  firstName: 'Banned',
  lastName: 'User',
  image: null,
  phoneNumber: null,
  phoneNumberVerified: false,
  invitedById: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  role: UserRoles.USER,
  banned: true,
  banReason: 'Violation of terms',
  banExpires: '2025-01-01T00:00:00.000Z'
}

export const createMockUser = (overrides?: Partial<User>): User => ({
  ...mockRegularUser,
  ...overrides
})
