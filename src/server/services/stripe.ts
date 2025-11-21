import Stripe from 'stripe'
import type { ExtensionPaymentLinkDepositInsertData } from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link/create-extension-insert-data/create-extension-payment-link-deposit-insert-data'
import type { ExtensionPaymentLinkInstallmentsDepositInsertData } from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link/create-extension-insert-data/create-extension-payment-link-installments-deposit-insert-data'
import type { ExtensionPaymentLinkInstallmentsInsertData } from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link/create-extension-insert-data/create-extension-payment-link-installments-insert-data'
import type { ExtensionPaymentLinkIntegralInsertData } from '~/server/trpc/router/protected/extension-payment-links/procedures/create-one-extension-payment-link/create-extension-insert-data/create-extension-payment-link-integral-insert-data'
import type { ProductPaymentLinkDepositInsertData } from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data/create-product-payment-link-deposit-insert-data'
import type { ProductPaymentLinkInstallmentsDepositInsertData } from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data/create-product-payment-link-installments-deposit-insert-data'
import type { ProductPaymentLinkInstallmentsInsertData } from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data/create-product-payment-link-installments-insert-data'
import type { ProductPaymentLinkIntegralInsertData } from '~/server/trpc/router/protected/product-payment-links/procedures/create-one-product-payment-link/create-product-insert-data/create-product-payment-link-integral-insert-data'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'

export type { Stripe } from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true
})

export type StripePaymentIntent = Stripe.Response<
  Stripe.PaymentIntent & { clientSecret: string }
>

export type PaymentIntentProductIntegralMetadata =
  ProductPaymentLinkIntegralInsertData & {
    productPaymentLinkId: string
  }
export type PaymentIntentProductDepositMetadata =
  ProductPaymentLinkDepositInsertData & {
    productPaymentLinkId: string
  }
export type PaymentIntentProductInstallmentsMetadata =
  ProductPaymentLinkInstallmentsInsertData & {
    productPaymentLinkId: string
  }
export type PaymentIntentProductInstallmentsDepositMetadata =
  ProductPaymentLinkInstallmentsDepositInsertData & {
    productPaymentLinkId: string
  }

export type PaymentIntentExtensionIntegralMetadata =
  ExtensionPaymentLinkIntegralInsertData & {
    extensionPaymentLinkId: string
  }
export type PaymentIntentExtensionDepositMetadata =
  ExtensionPaymentLinkDepositInsertData & {
    extensionPaymentLinkId: string
  }
export type PaymentIntentExtensionInstallmentsMetadata =
  ExtensionPaymentLinkInstallmentsInsertData & {
    extensionPaymentLinkId: string
  }
export type PaymentIntentExtensionInstallmentsDepositMetadata =
  ExtensionPaymentLinkInstallmentsDepositInsertData & {
    extensionPaymentLinkId: string
  }

export type ProductPaymentIntentMetadata =
  | PaymentIntentProductIntegralMetadata
  | PaymentIntentProductDepositMetadata
  | PaymentIntentProductInstallmentsMetadata
  | PaymentIntentProductInstallmentsDepositMetadata

export type ExtensionPaymentIntentMetadata =
  | PaymentIntentExtensionIntegralMetadata
  | PaymentIntentExtensionDepositMetadata
  | PaymentIntentExtensionInstallmentsMetadata
  | PaymentIntentExtensionInstallmentsDepositMetadata

export type PaymentIntentMetadata = (
  | ProductPaymentIntentMetadata
  | ExtensionPaymentIntentMetadata
) & {
  isRenewalPayment?: 'true' | undefined
}

class StripeServiceImpl {
  public async chargeDeferredPayment({
    metadata,
    payment
  }: {
    metadata:
      | PaymentIntentProductDepositMetadata
      | PaymentIntentExtensionDepositMetadata
    payment: {
      paymentMethodId: string
      customerId: string
      amountInCents: string
    }
  }): Promise<StripePaymentIntent> {
    try {
      const amount = parseInt(payment.amountInCents, 10)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        confirm: true,
        currency: metadata.currency,
        customer: payment.customerId,
        metadata: {
          ...metadata,
          isRenewalPayment: 'true' // Flag to prevent webhook from creating duplicate subscription
        },
        off_session: true,
        payment_method: payment.paymentMethodId
      })

      if (!paymentIntent.client_secret)
        throw new Error(
          'Failed to retrieve client secret from the deferred created payment intent'
        )

      return {
        ...paymentIntent,
        clientSecret: paymentIntent.client_secret
      }
    } catch (cause) {
      throw new Error('Failed to charge deferred payment', {
        cause
      })
    }
  }

  async findPaymentIntentById(id: string): Promise<StripePaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(id)
      if (!paymentIntent.client_secret)
        throw new Error(
          'Failed to retrieve client secret from the found payment intent'
        )
      return {
        ...paymentIntent,
        clientSecret: paymentIntent.client_secret
      }
    } catch (cause) {
      throw new Error('Failed to find payment intent by id', {
        cause
      })
    }
  }

  private getPaymentIntentAmountToPayInCents(data: PaymentIntentMetadata) {
    switch (data.type) {
      case PaymentLinkType.Integral: {
        return parseInt(data.totalAmountToPayInCents, 10)
      }
      case PaymentLinkType.Deposit: {
        return parseInt(data.depositAmountInCents, 10)
      }

      case PaymentLinkType.Installments: {
        return parseInt(
          data.paymentProductType === PaymentProductType.Product
            ? data.productInstallmentAmountToPayInCents
            : data.extensionInstallmentAmountToPayInCents,
          10
        )
      }
      case PaymentLinkType.InstallmentsDeposit: {
        return parseInt(data.depositAmountInCents, 10)
      }
    }
  }

  async createPaymentIntent(
    data: PaymentIntentMetadata
  ): Promise<StripePaymentIntent> {
    try {
      const amountToPayInCents = this.getPaymentIntentAmountToPayInCents(data)

      // Create Stripe customer for future off-session payments
      const customer = await stripe.customers.create({
        email: data.customerEmail,
        metadata: {
          customerEmail: data.customerEmail,
          customerName: data.customerName
        },
        name: data.customerName ?? undefined
      })

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountToPayInCents,
        currency: data.currency,
        customer: customer.id,
        metadata: data,
        payment_method_types: ['card'],
        setup_future_usage: 'off_session'
      })
      if (!paymentIntent.client_secret)
        throw new Error(
          'Failed to retrieve client secret from created payment intent'
        )

      return {
        ...paymentIntent,
        clientSecret: paymentIntent.client_secret
      }
    } catch (cause) {
      throw new Error('Failed to create payment intent', {
        cause
      })
    }
  }

  async chargeInstallmentPayment({
    customerId,
    metadata,
    paymentMethodId,
    priceAmountInCents
  }: {
    customerId: string
    metadata:
      | PaymentIntentProductInstallmentsMetadata
      | PaymentIntentProductInstallmentsDepositMetadata
    paymentMethodId: string
    priceAmountInCents: number
  }): Promise<StripePaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceAmountInCents,
        confirm: true,
        currency: metadata.currency,
        customer: customerId,
        metadata: {
          ...metadata,
          isRenewalPayment: 'true' // Flag to prevent webhook from creating duplicate subscription
        },
        off_session: true,
        payment_method: paymentMethodId
      })

      if (!paymentIntent.client_secret)
        throw new Error(
          'Failed to retrieve client secret from installment payment intent'
        )

      return {
        ...paymentIntent,
        clientSecret: paymentIntent.client_secret
      }
    } catch (cause) {
      throw new Error('Failed to charge installment payment', {
        cause
      })
    }
  }
}

export const StripeService = new StripeServiceImpl()
