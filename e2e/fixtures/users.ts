import { UserRoles } from '~/shared/enums/user-roles'

/**
 * E2E User Fixtures
 * Test data for users used in e2e tests
 */

export const e2eUsers = {
  admin: {
    id: 'e2e_user_admin',
    email: 'admin.e2e@example.com',
    name: 'E2E Admin User',
    password: 'TestPassword123!',
    role: UserRoles.ADMIN
  },
  regular: {
    id: 'e2e_user_regular',
    email: 'user.e2e@example.com',
    name: 'E2E Regular User',
    password: 'TestPassword123!',
    role: UserRoles.USER
  },
  customer1: {
    id: 'e2e_customer_1',
    email: 'customer1.e2e@example.com',
    name: 'E2E Customer One',
    phoneNumber: '+40712345678'
  },
  customer2: {
    id: 'e2e_customer_2',
    email: 'customer2.e2e@example.com',
    name: 'E2E Customer Two',
    phoneNumber: '+40712345679'
  }
} as const

export const e2eContracts = {
  contract1: {
    id: 'e2e_contract_1',
    createdById: 'e2e_user_admin'
  },
  contract2: {
    id: 'e2e_contract_2',
    createdById: 'e2e_user_regular'
  }
} as const
