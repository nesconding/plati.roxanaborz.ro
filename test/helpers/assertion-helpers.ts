import { expect } from 'vitest'
import type Decimal from 'decimal.js-light'

/**
 * Custom assertion helpers for tests
 */

/**
 * Assert that a Decimal value equals the expected value
 */
export const expectDecimalToEqual = (
  actual: Decimal,
  expected: string | number
) => {
  expect(actual.toString()).toBe(expected.toString())
}

/**
 * Assert that a Decimal value is close to the expected value within a tolerance
 */
export const expectDecimalToBeCloseTo = (
  actual: Decimal,
  expected: string | number,
  tolerance: number = 0.01
) => {
  const actualNum = Number(actual.toString())
  const expectedNum = Number(expected.toString())
  expect(Math.abs(actualNum - expectedNum)).toBeLessThanOrEqual(tolerance)
}

/**
 * Assert that a date is after another date
 */
export const expectDateToBeAfter = (actual: Date, expected: Date) => {
  expect(actual.getTime()).toBeGreaterThan(expected.getTime())
}

/**
 * Assert that a date is before another date
 */
export const expectDateToBeBefore = (actual: Date, expected: Date) => {
  expect(actual.getTime()).toBeLessThan(expected.getTime())
}

/**
 * Assert that a date is within a range
 */
export const expectDateToBeWithinRange = (
  actual: Date,
  start: Date,
  end: Date
) => {
  expect(actual.getTime()).toBeGreaterThanOrEqual(start.getTime())
  expect(actual.getTime()).toBeLessThanOrEqual(end.getTime())
}

/**
 * Assert that a value is a valid ISO date string
 */
export const expectToBeValidISODate = (value: string) => {
  const date = new Date(value)
  expect(date.toISOString()).toBe(value)
}

/**
 * Assert that an object matches a subset of properties
 */
export const expectObjectToMatchSubset = (
  actual: Record<string, any>,
  expected: Record<string, any>
) => {
  for (const [key, value] of Object.entries(expected)) {
    expect(actual).toHaveProperty(key, value)
  }
}

/**
 * Assert that a value is a valid Stripe ID with a specific prefix
 */
export const expectToBeValidStripeId = (
  value: string,
  prefix: 'pi' | 'cus' | 'pm' | 'sub'
) => {
  expect(value).toMatch(new RegExp(`^${prefix}_`))
}

/**
 * Assert that an error was thrown with a specific message
 */
export const expectErrorWithMessage = (
  fn: () => any,
  message: string | RegExp
) => {
  expect(fn).toThrow(message)
}

/**
 * Assert that an async error was thrown with a specific message
 */
export const expectAsyncErrorWithMessage = async (
  fn: () => Promise<any>,
  message: string | RegExp
) => {
  await expect(fn()).rejects.toThrow(message)
}
