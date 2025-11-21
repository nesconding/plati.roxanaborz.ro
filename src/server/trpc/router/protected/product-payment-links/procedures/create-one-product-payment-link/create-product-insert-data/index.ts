import { TRPCError } from '@trpc/server'
import type { database } from '~/server/database/drizzle'
import { DatesService } from '~/server/services/dates'

import {
  createProductPaymentLinkDepositInsertData,
  type ProductPaymentLinkDepositInsertData
} from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data/create-product-payment-link-deposit-insert-data'
import {
  createProductPaymentLinkInstallmentsDepositInsertData,
  type ProductPaymentLinkInstallmentsDepositInsertData
} from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data/create-product-payment-link-installments-deposit-insert-data'
import {
  createProductPaymentLinkInstallmentsInsertData,
  type ProductPaymentLinkInstallmentsInsertData
} from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data/create-product-payment-link-installments-insert-data'
import {
  createProductPaymentLinkIntegralInsertData,
  type ProductPaymentLinkIntegralInsertData
} from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data/create-product-payment-link-integral-insert-data'
import type { CreateProductPaymentLinkFormData } from '~/shared/create-product-payment-link-form/data'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { UsersTableValidators } from '~/shared/validation/tables'

export type ProductPaymentLinkInsertData =
  | ProductPaymentLinkIntegralInsertData
  | ProductPaymentLinkDepositInsertData
  | ProductPaymentLinkInstallmentsInsertData
  | ProductPaymentLinkInstallmentsDepositInsertData

export async function createProductPaymentLinkInsertData({
  data,
  db,
  user
}: {
  data: CreateProductPaymentLinkFormData
  db: typeof database
  user: typeof UsersTableValidators.$types.select
}): Promise<ProductPaymentLinkInsertData> {
  console.log(data.scheduledEventId)

  const [constants, scheduledEvent, product, setting] = await Promise.all([
    db.query.constants.findFirst(),
    db.query.calendly_scheduled_events.findFirst({
      where: (calendly_scheduled_events, { eq }) =>
        eq(calendly_scheduled_events.id, data.scheduledEventId)
    }),
    db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, data.productId)
    }),
    db.query.payments_settings.findFirst({
      where: (payments_settings, { eq }) =>
        eq(payments_settings.id, data.paymentSettingId)
    })
  ])

  if (!product) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Product not found'
    })
  }

  if (!setting) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Payment setting not found'
    })
  }

  if (!scheduledEvent) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'ScheduledEvent not found'
    })
  }

  if (!constants) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Constants not found'
    })
  }

  const expiresAt = DatesService.createPaymentLinkExpiresAt()

  switch (data.type) {
    case PaymentLinkType.Integral: {
      return createProductPaymentLinkIntegralInsertData({
        data,
        eurToRonRate: constants.eurToRonRate,
        expiresAt,
        product,
        scheduledEvent,
        setting,
        user
      })
    }

    case PaymentLinkType.Deposit: {
      const firstPaymentDateAfterDepositOption =
        await db.query.first_payment_date_after_deposit_options.findFirst({
          where: (first_payment_date_after_deposit_options, { eq }) =>
            eq(
              first_payment_date_after_deposit_options.id,
              data.firstPaymentDateAfterDepositOptionId
            )
        })
      if (!firstPaymentDateAfterDepositOption) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'First payment date after deposit option not found'
        })
      }
      return createProductPaymentLinkDepositInsertData({
        data,
        eurToRonRate: constants.eurToRonRate,
        expiresAt,
        firstPaymentDateAfterDepositOption,
        product,
        scheduledEvent,
        setting,
        user
      })
    }

    case PaymentLinkType.Installments: {
      const baseProductInstallment =
        await db.query.products_installments.findFirst({
          where: (products_installments, { eq }) =>
            eq(products_installments.id, data.productInstallmentId)
        })
      if (!baseProductInstallment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Base product installment not found'
        })
      }
      return createProductPaymentLinkInstallmentsInsertData({
        baseProductInstallment,
        data,
        eurToRonRate: constants.eurToRonRate,
        expiresAt,
        product,
        scheduledEvent,
        setting,
        user
      })
    }

    case PaymentLinkType.InstallmentsDeposit: {
      const [baseProductInstallment, firstPaymentDateAfterDepositOption] =
        await Promise.all([
          db.query.products_installments.findFirst({
            where: (productsInstallments, { eq }) =>
              eq(productsInstallments.id, data.productInstallmentId)
          }),
          db.query.first_payment_date_after_deposit_options.findFirst({
            where: (first_payment_date_after_deposit_options, { eq }) =>
              eq(
                first_payment_date_after_deposit_options.id,
                data.firstPaymentDateAfterDepositOptionId
              )
          })
        ])
      if (!baseProductInstallment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Base product installment not found'
        })
      }
      if (!firstPaymentDateAfterDepositOption) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'First payment date after deposit option not found'
        })
      }
      return createProductPaymentLinkInstallmentsDepositInsertData({
        baseProductInstallment,
        data,
        eurToRonRate: constants.eurToRonRate,
        expiresAt,
        firstPaymentDateAfterDepositOption,
        product,
        scheduledEvent,
        setting,
        user
      })
    }

    default: {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Payment link type not found'
      })
    }
  }
}
