import { vi } from 'vitest'

/**
 * Mock Drizzle ORM database for testing
 * Provides mock implementations of common database operations
 */

export const createMockDbQuery = () => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([])
})

export const createMockDbInsert = () => ({
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([]),
  onConflictDoNothing: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis()
})

export const createMockDbUpdate = () => ({
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([])
})

export const createMockDbDelete = () => ({
  delete: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([])
})

export const createMockDbTransaction = () => ({
  transaction: vi.fn((callback) => callback(mockDatabase))
})

/**
 * Mock Drizzle relational query API
 * Used for db.query.tableName.findMany() and db.query.tableName.findFirst()
 */
export const createMockRelationalQuery = () => ({
  findMany: vi.fn().mockResolvedValue([]),
  findFirst: vi.fn().mockResolvedValue(undefined)
})

/**
 * Mock database query object with all table queries
 * Supports db.query.tableName.findMany() and db.query.tableName.findFirst()
 */
export const createMockDbQueryObject = () => ({
  products: createMockRelationalQuery(),
  products_extensions: createMockRelationalQuery(),
  product_payment_links: createMockRelationalQuery(),
  product_orders: createMockRelationalQuery(),
  product_subscriptions: createMockRelationalQuery(),
  extension_payment_links: createMockRelationalQuery(),
  extension_orders: createMockRelationalQuery(),
  extension_subscriptions: createMockRelationalQuery(),
  memberships: createMockRelationalQuery(),
  users: createMockRelationalQuery()
})

/**
 * Mock database instance with all common operations
 */
export const mockDatabase = {
  ...createMockDbQuery(),
  ...createMockDbInsert(),
  ...createMockDbUpdate(),
  ...createMockDbDelete(),
  ...createMockDbTransaction(),
  query: createMockDbQueryObject()
}

/**
 * Reset all database mocks
 */
export const resetDatabaseMocks = () => {
  vi.clearAllMocks()
}

/**
 * Helper to mock a successful insert operation
 */
export const mockInsertSuccess = (returnValue: any) => {
  mockDatabase.insert.mockReturnThis()
  mockDatabase.values.mockReturnThis()
  mockDatabase.returning.mockResolvedValue([returnValue])
  return mockDatabase
}

/**
 * Helper to mock a successful select operation
 */
export const mockSelectSuccess = (returnValue: any[]) => {
  mockDatabase.select.mockReturnThis()
  mockDatabase.from.mockReturnThis()
  mockDatabase.where.mockReturnThis()
  mockDatabase.limit.mockResolvedValue(returnValue)
  return mockDatabase
}

/**
 * Helper to mock a successful update operation
 */
export const mockUpdateSuccess = (returnValue: any) => {
  mockDatabase.update.mockReturnThis()
  mockDatabase.set.mockReturnThis()
  mockDatabase.where.mockReturnThis()
  mockDatabase.returning.mockResolvedValue([returnValue])
  return mockDatabase
}

/**
 * Helper to mock a successful delete operation
 */
export const mockDeleteSuccess = (returnValue: any) => {
  mockDatabase.delete.mockReturnThis()
  mockDatabase.where.mockReturnThis()
  mockDatabase.returning.mockResolvedValue([returnValue])
  return mockDatabase
}

/**
 * Helper to mock a successful relational findFirst operation
 */
export const mockRelationalFindFirst = (
  tableName: keyof ReturnType<typeof createMockDbQueryObject>,
  returnValue: any
) => {
  mockDatabase.query[tableName].findFirst.mockResolvedValue(returnValue)
  return mockDatabase
}

/**
 * Helper to mock a successful relational findMany operation
 */
export const mockRelationalFindMany = (
  tableName: keyof ReturnType<typeof createMockDbQueryObject>,
  returnValue: any[]
) => {
  mockDatabase.query[tableName].findMany.mockResolvedValue(returnValue)
  return mockDatabase
}
