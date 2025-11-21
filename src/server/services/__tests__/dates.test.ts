import { describe, expect, it } from 'vitest'
import { DatesService, DatesServiceImpl } from '~/server/services/dates'
import {
  expectDateToBeAfter,
  expectDateToBeBefore,
  expectDateToBeWithinRange
} from '#test/helpers/assertion-helpers'

describe('DatesService', () => {
  describe('createPaymentLinkExpiresAt', () => {
    it('should create an expiration date 24 hours from now', () => {
      const before = new Date()
      const result = DatesService.createPaymentLinkExpiresAt()
      const after = new Date()

      // Result should be approximately 24 hours in the future
      const expectedMin = new Date(before.getTime() + 24 * 60 * 60 * 1000)
      const expectedMax = new Date(after.getTime() + 24 * 60 * 60 * 1000)

      expectDateToBeWithinRange(result, expectedMin, expectedMax)
    })

    it('should use the constant PAYMENT_LINK_EXPIRES_AT_HOURS', () => {
      const now = new Date()
      const result = DatesService.createPaymentLinkExpiresAt()
      const hoursDiff = (result.getTime() - now.getTime()) / (1000 * 60 * 60)

      // Should be approximately 24 hours (within 1 second tolerance for execution time)
      expect(hoursDiff).toBeGreaterThanOrEqual(
        DatesServiceImpl.PAYMENT_LINK_EXPIRES_AT_HOURS - 0.001
      )
      expect(hoursDiff).toBeLessThanOrEqual(
        DatesServiceImpl.PAYMENT_LINK_EXPIRES_AT_HOURS + 0.001
      )
    })

    it('should return a future date', () => {
      const now = new Date()
      const result = DatesService.createPaymentLinkExpiresAt()

      expectDateToBeAfter(result, now)
    })
  })

  describe('addDays', () => {
    it('should add days to a date', () => {
      const date = new Date('2024-01-15')
      const result = DatesService.addDays(date, 5)
      const expected = new Date('2024-01-20')

      expect(result.toISOString().split('T')[0]).toBe(
        expected.toISOString().split('T')[0]
      )
    })

    it('should subtract days when given negative number', () => {
      const date = new Date('2024-01-15')
      const result = DatesService.addDays(date, -5)
      const expected = new Date('2024-01-10')

      expect(result.toISOString().split('T')[0]).toBe(
        expected.toISOString().split('T')[0]
      )
    })

    it('should handle adding zero days', () => {
      const date = new Date('2024-01-15T10:00:00.000Z')
      const result = DatesService.addDays(date, 0)

      expect(result.getTime()).toBe(date.getTime())
    })

    it('should handle dates across month boundaries', () => {
      const date = new Date('2024-01-31')
      const result = DatesService.addDays(date, 1)
      const expected = new Date('2024-02-01')

      expect(result.toISOString().split('T')[0]).toBe(
        expected.toISOString().split('T')[0]
      )
    })

    it('should handle leap years correctly', () => {
      const date = new Date('2024-02-28')
      const result = DatesService.addDays(date, 1)
      const expected = new Date('2024-02-29')

      expect(result.toISOString().split('T')[0]).toBe(
        expected.toISOString().split('T')[0]
      )
    })
  })

  describe('addMonths', () => {
    it('should add months to a date', () => {
      const date = new Date('2024-01-15T12:00:00.000Z')
      const result = DatesService.addMonths(date, 3)
      const expected = new Date('2024-04-15T12:00:00.000Z')

      expect(result.toISOString().split('T')[0]).toBe(
        expected.toISOString().split('T')[0]
      )
    })

    it('should subtract months when given negative number', () => {
      const date = new Date('2024-04-15')
      const result = DatesService.addMonths(date, -3)
      const expected = new Date('2024-01-15')

      expect(result.toISOString().split('T')[0]).toBe(
        expected.toISOString().split('T')[0]
      )
    })

    it('should handle adding zero months', () => {
      const date = new Date('2024-01-15T10:00:00.000Z')
      const result = DatesService.addMonths(date, 0)

      expect(result.getTime()).toBe(date.getTime())
    })

    it('should handle dates across year boundaries', () => {
      const date = new Date('2024-11-15')
      const result = DatesService.addMonths(date, 3)
      const expected = new Date('2025-02-15')

      expect(result.toISOString().split('T')[0]).toBe(
        expected.toISOString().split('T')[0]
      )
    })

    it('should handle adding 12 months', () => {
      const date = new Date('2024-01-15')
      const result = DatesService.addMonths(date, 12)
      const expected = new Date('2025-01-15')

      expect(result.toISOString().split('T')[0]).toBe(
        expected.toISOString().split('T')[0]
      )
    })

    it('should handle month-end dates correctly', () => {
      const date = new Date('2024-01-31')
      const result = DatesService.addMonths(date, 1)
      // February doesn't have 31 days, so it should be the last day of February
      const expected = new Date('2024-02-29')

      expect(result.toISOString().split('T')[0]).toBe(
        expected.toISOString().split('T')[0]
      )
    })
  })

  describe('startOfDay', () => {
    it('should return start of day (midnight)', () => {
      const date = new Date('2024-01-15T14:30:45.123Z')
      const result = DatesService.startOfDay(date)

      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })

    it('should not modify the original date', () => {
      const original = new Date('2024-01-15T14:30:45.123Z')
      const originalTime = original.getTime()

      DatesService.startOfDay(original)

      expect(original.getTime()).toBe(originalTime)
    })

    it('should handle already start-of-day dates', () => {
      const date = new Date('2024-01-15T14:30:45.123Z')
      const startDate = DatesService.startOfDay(date)
      const result = DatesService.startOfDay(startDate)

      expect(result.getTime()).toBe(startDate.getTime())
    })
  })

  describe('endOfDay', () => {
    it('should return end of day (23:59:59.999)', () => {
      const date = new Date('2024-01-15T14:30:45.123Z')
      const result = DatesService.endOfDay(date)

      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
      expect(result.getMilliseconds()).toBe(999)
    })

    it('should not modify the original date', () => {
      const original = new Date('2024-01-15T14:30:45.123Z')
      const originalTime = original.getTime()

      DatesService.endOfDay(original)

      expect(original.getTime()).toBe(originalTime)
    })

    it('should handle already end-of-day dates', () => {
      const date = new Date('2024-01-15T14:30:45.123Z')
      const endDate = DatesService.endOfDay(date)
      const result = DatesService.endOfDay(endDate)

      expect(result.getTime()).toBe(endDate.getTime())
    })
  })

  describe('isAfter', () => {
    it('should return true when first date is after second', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-10')

      expect(DatesService.isAfter(date1, date2)).toBe(true)
    })

    it('should return false when first date is before second', () => {
      const date1 = new Date('2024-01-10')
      const date2 = new Date('2024-01-15')

      expect(DatesService.isAfter(date1, date2)).toBe(false)
    })

    it('should return false when dates are equal', () => {
      const date1 = new Date('2024-01-15T10:00:00.000Z')
      const date2 = new Date('2024-01-15T10:00:00.000Z')

      expect(DatesService.isAfter(date1, date2)).toBe(false)
    })

    it('should handle time differences', () => {
      const date1 = new Date('2024-01-15T10:00:01.000Z')
      const date2 = new Date('2024-01-15T10:00:00.000Z')

      expect(DatesService.isAfter(date1, date2)).toBe(true)
    })
  })

  describe('isBefore', () => {
    it('should return true when first date is before second', () => {
      const date1 = new Date('2024-01-10')
      const date2 = new Date('2024-01-15')

      expect(DatesService.isBefore(date1, date2)).toBe(true)
    })

    it('should return false when first date is after second', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-10')

      expect(DatesService.isBefore(date1, date2)).toBe(false)
    })

    it('should return false when dates are equal', () => {
      const date1 = new Date('2024-01-15T10:00:00.000Z')
      const date2 = new Date('2024-01-15T10:00:00.000Z')

      expect(DatesService.isBefore(date1, date2)).toBe(false)
    })

    it('should handle time differences', () => {
      const date1 = new Date('2024-01-15T10:00:00.000Z')
      const date2 = new Date('2024-01-15T10:00:01.000Z')

      expect(DatesService.isBefore(date1, date2)).toBe(true)
    })
  })

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-01-15T14:30:00.000Z')
      const result = DatesService.formatDate(date)

      // Default format is 'PPP - HH:mm' with Romanian locale
      // Should contain the date and time
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T14:30:00.000Z')
      const result = DatesService.formatDate(date, 'yyyy-MM-dd')

      expect(result).toMatch(/2024-01-15/)
    })

    it('should format date with time format', () => {
      const date = new Date('2024-01-15T14:30:00.000Z')
      const result = DatesService.formatDate(date, 'HH:mm:ss')

      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/)
    })

    it('should use Romanian locale', () => {
      const date = new Date('2024-01-15T14:30:00.000Z')
      const result = DatesService.formatDate(date, 'EEEE')

      // Monday in Romanian should be "luni"
      expect(result.toLowerCase()).toContain('luni')
    })

    it('should format different months correctly', () => {
      const dates = [
        new Date('2024-01-15'),
        new Date('2024-02-15'),
        new Date('2024-12-15')
      ]

      dates.forEach((date) => {
        const result = DatesService.formatDate(date, 'MMMM')
        expect(result).toBeTruthy()
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Integration tests', () => {
    it('should correctly chain date operations', () => {
      const start = new Date('2024-01-01')

      const addedDays = DatesService.addDays(start, 15)
      const addedMonths = DatesService.addMonths(addedDays, 2)
      const startOfDay = DatesService.startOfDay(addedMonths)

      expect(DatesService.isAfter(startOfDay, start)).toBe(true)
      expect(DatesService.isBefore(start, startOfDay)).toBe(true)
    })

    it('should correctly determine payment link expiration workflow', () => {
      const now = new Date()
      const expiresAt = DatesService.createPaymentLinkExpiresAt()
      const isExpired = DatesService.isAfter(now, expiresAt)
      const willExpire = DatesService.isBefore(now, expiresAt)

      expect(isExpired).toBe(false)
      expect(willExpire).toBe(true)

      // Simulate time passing beyond expiration
      const future = DatesService.addDays(now, 2)
      const futureIsAfterExpiry = DatesService.isAfter(future, expiresAt)

      expect(futureIsAfterExpiry).toBe(true)
    })

    it('should handle start and end of day boundaries', () => {
      const date = new Date('2024-01-15T14:30:00.000Z')

      const start = DatesService.startOfDay(date)
      const end = DatesService.endOfDay(date)

      expect(DatesService.isBefore(start, end)).toBe(true)
      expect(DatesService.isAfter(end, start)).toBe(true)

      const timeDiff = end.getTime() - start.getTime()
      const expectedDiff = 24 * 60 * 60 * 1000 - 1 // One day minus 1 millisecond

      expect(timeDiff).toBe(expectedDiff)
    })
  })
})
