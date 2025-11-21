import { vi } from 'vitest'
import type { Database } from '~/server/database/drizzle'

/**
 * Database test helpers
 */

/**
 * Create a mock database transaction
 * Executes the callback immediately with the provided db instance
 */
export const createMockTransaction = (db: any) => {
  return vi.fn(async (callback) => {
    return await callback(db)
  })
}

/**
 * Create a mock query builder chain
 * Useful for mocking Drizzle's fluent API
 */
export const createMockQueryBuilder = (returnValue: any) => {
  const builder = {
    select: vi.fn().mockReturnValue(builder),
    from: vi.fn().mockReturnValue(builder),
    where: vi.fn().mockReturnValue(builder),
    limit: vi.fn().mockReturnValue(builder),
    offset: vi.fn().mockReturnValue(builder),
    orderBy: vi.fn().mockReturnValue(builder),
    leftJoin: vi.fn().mockReturnValue(builder),
    innerJoin: vi.fn().mockReturnValue(builder),
    execute: vi.fn().mockResolvedValue(returnValue),
    then: vi.fn((resolve) => resolve(returnValue)) // For await support
  }
  return builder
}

/**
 * Create a mock insert builder
 */
export const createMockInsertBuilder = (returnValue: any) => {
  const builder = {
    insert: vi.fn().mockReturnValue(builder),
    values: vi.fn().mockReturnValue(builder),
    returning: vi.fn().mockResolvedValue([returnValue]),
    onConflictDoNothing: vi.fn().mockReturnValue(builder),
    onConflictDoUpdate: vi.fn().mockReturnValue(builder),
    then: vi.fn((resolve) => resolve([returnValue]))
  }
  return builder
}

/**
 * Create a mock update builder
 */
export const createMockUpdateBuilder = (returnValue: any) => {
  const builder = {
    update: vi.fn().mockReturnValue(builder),
    set: vi.fn().mockReturnValue(builder),
    where: vi.fn().mockReturnValue(builder),
    returning: vi.fn().mockResolvedValue([returnValue]),
    then: vi.fn((resolve) => resolve([returnValue]))
  }
  return builder
}

/**
 * Create a mock delete builder
 */
export const createMockDeleteBuilder = (returnValue: any) => {
  const builder = {
    delete: vi.fn().mockReturnValue(builder),
    where: vi.fn().mockReturnValue(builder),
    returning: vi.fn().mockResolvedValue([returnValue]),
    then: vi.fn((resolve) => resolve([returnValue]))
  }
  return builder
}

/**
 * Assert that a database method was called with specific conditions
 */
export const expectDbMethodCalled = (method: any, times: number = 1) => {
  expect(method).toHaveBeenCalledTimes(times)
}

/**
 * Assert that a where clause was called with expected conditions
 */
export const expectWhereClauseCalled = (
  whereMethod: any,
  expectedCondition?: any
) => {
  if (expectedCondition) {
    expect(whereMethod).toHaveBeenCalledWith(expectedCondition)
  } else {
    expect(whereMethod).toHaveBeenCalled()
  }
}

/**
 * Create a spy on database methods
 */
export const spyOnDbMethods = (db: Partial<Database>) => {
  const spies = {
    select: vi.spyOn(db as any, 'select'),
    insert: vi.spyOn(db as any, 'insert'),
    update: vi.spyOn(db as any, 'update'),
    delete: vi.spyOn(db as any, 'delete')
  }
  return spies
}
