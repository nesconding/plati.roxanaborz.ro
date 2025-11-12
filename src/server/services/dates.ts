import {
  addDays,
  addHours,
  addMonths,
  type DateArg,
  endOfDay,
  format,
  isAfter,
  isBefore,
  startOfDay
} from 'date-fns'
import { ro } from 'date-fns/locale'

export class DatesServiceImpl {
  static PAYMENT_LINK_EXPIRES_AT_HOURS = 24

  createPaymentLinkExpiresAt(): Date {
    return addHours(new Date(), DatesServiceImpl.PAYMENT_LINK_EXPIRES_AT_HOURS)
  }

  addDays<DateType extends Date>(date: DateArg<DateType>, days: number): Date {
    return addDays(date, days)
  }
  addMonths<DateType extends Date>(
    date: DateArg<DateType>,
    months: number
  ): Date {
    return addMonths(date, months)
  }
  startOfDay<DateType extends Date>(date: DateArg<DateType>): Date {
    return startOfDay(date)
  }
  endOfDay<DateType extends Date>(date: DateArg<DateType>): Date {
    return endOfDay(date)
  }
  isAfter<DateType extends Date>(
    date: DateArg<DateType>,
    dateToCompare: DateArg<DateType>
  ): boolean {
    return isAfter(date, dateToCompare)
  }
  isBefore<DateType extends Date>(
    date: DateArg<DateType>,
    dateToCompare: DateArg<DateType>
  ): boolean {
    return isBefore(date, dateToCompare)
  }
  formatDate(date: DateArg<Date>): string {
    return format(date, 'PPP - HH:mm', { locale: ro })
  }
}

export const DatesService = new DatesServiceImpl()
