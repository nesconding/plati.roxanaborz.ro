import { TRPCError } from '@trpc/server'
import type { database } from '~/server/database/drizzle'
import { DatesService } from '~/server/services/dates'
import {
  createExtensionPaymentLinkDepositInsertData,
  type ExtensionPaymentLinkDepositInsertData
} from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link/create-extension-insert-data/create-extension-payment-link-deposit-insert-data'
import {
  createExtensionPaymentLinkInstallmentsDepositInsertData,
  type ExtensionPaymentLinkInstallmentsDepositInsertData
} from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link/create-extension-insert-data/create-extension-payment-link-installments-deposit-insert-data'
import {
  createExtensionPaymentLinkInstallmentsInsertData,
  type ExtensionPaymentLinkInstallmentsInsertData
} from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link/create-extension-insert-data/create-extension-payment-link-installments-insert-data'
import {
  createExtensionPaymentLinkIntegralInsertData,
  type ExtensionPaymentLinkIntegralInsertData
} from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link/create-extension-insert-data/create-extension-payment-link-integral-insert-data'
import type { CreateExtensionPaymentLinkFormData } from '~/shared/create-extension-payment-link-form/data'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import type { UsersTableValidators } from '~/shared/validation/tables'

export type ExtensionPaymentLinkInsertData =
  | ExtensionPaymentLinkIntegralInsertData
  | ExtensionPaymentLinkDepositInsertData
  | ExtensionPaymentLinkInstallmentsInsertData
  | ExtensionPaymentLinkInstallmentsDepositInsertData

export async function createExtensionPaymentLinkInsertData({
  data,
  db,
  user
}: {
  data: CreateExtensionPaymentLinkFormData
  db: typeof database
  user: typeof UsersTableValidators.$types.select
}): Promise<ExtensionPaymentLinkInsertData> {
  const [constants, extension, membership, setting] = await Promise.all([
    db.query.constants.findFirst(),
    db.query.products_extensions.findFirst({
      where: (products_extensions, { eq }) =>
        eq(products_extensions.id, data.extensionId),
      with: { product: true }
    }),
    db.query.memberships.findFirst({
      where: (memberships, { eq }) => eq(memberships.id, data.membershipId),
      with: { parentOrder: true }
    }),
    db.query.payments_settings.findFirst({
      where: (payments_settings, { eq }) =>
        eq(payments_settings.id, data.paymentSettingId)
    })
  ])

  if (!constants) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Constants not found'
    })
  }
  if (!extension || !extension.product) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Extension not found'
    })
  }

  if (!membership || !membership.parentOrder) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Membership or parent order not found'
    })
  }

  if (!setting) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Payment setting not found'
    })
  }
  const customerName = membership.parentOrder.customerName
  const customerEmail = membership.parentOrder.customerEmail

  const expiresAt = DatesService.createPaymentLinkExpiresAt()

  switch (data.type) {
    case PaymentLinkType.Integral: {
      return createExtensionPaymentLinkIntegralInsertData({
        customerEmail,
        customerName,
        data,
        eurToRonRate: constants.eurToRonRate,
        expiresAt,
        extension,
        productName: extension.product.name,
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
      return createExtensionPaymentLinkDepositInsertData({
        customerEmail,
        customerName,
        data,
        eurToRonRate: constants.eurToRonRate,
        expiresAt,
        extension,
        firstPaymentDateAfterDepositOption,
        productName: extension.product.name,
        setting,
        user
      })
    }

    case PaymentLinkType.Installments: {
      const extensionInstallment =
        await db.query.products_extensions_installments.findFirst({
          where: (products_extensions_installments, { eq }) =>
            eq(products_extensions_installments.id, data.extensionInstallmentId)
        })
      if (!extensionInstallment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Extension installment not found'
        })
      }
      return createExtensionPaymentLinkInstallmentsInsertData({
        customerEmail,
        customerName,
        data,
        eurToRonRate: constants.eurToRonRate,
        expiresAt,
        extensionInstallment,
        productName: extension.product.name,
        setting,
        user
      })
    }

    case PaymentLinkType.InstallmentsDeposit: {
      const [extensionInstallment, firstPaymentDateAfterDepositOption] =
        await Promise.all([
          db.query.products_extensions_installments.findFirst({
            where: (products_extensions_installments, { eq }) =>
              eq(
                products_extensions_installments.id,
                data.extensionInstallmentId
              )
          }),
          db.query.first_payment_date_after_deposit_options.findFirst({
            where: (first_payment_date_after_deposit_options, { eq }) =>
              eq(
                first_payment_date_after_deposit_options.id,
                data.firstPaymentDateAfterDepositOptionId
              )
          })
        ])
      if (!extensionInstallment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Extension installment not found'
        })
      }
      if (!firstPaymentDateAfterDepositOption) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'First payment date after deposit option not found'
        })
      }
      return createExtensionPaymentLinkInstallmentsDepositInsertData({
        customerEmail,
        customerName,
        data,
        eurToRonRate: constants.eurToRonRate,
        expiresAt,
        extensionInstallment,
        firstPaymentDateAfterDepositOption,
        productName: extension.product.name,
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
