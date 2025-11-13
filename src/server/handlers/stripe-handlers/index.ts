import type Stripe from 'stripe'
import { type Database, database } from '~/server/database/drizzle'
import type { PaymentIntentMetadata } from '~/server/services/stripe'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import type { PaymentStatusType } from '~/shared/enums/payment-status'
import { StripeExtensionHandlers } from './stripe-extension-handlers'
import { StripeProductHandlers } from './stripe-product-handlers'

/**
 * Unified Stripe Handlers
 * Orchestrates between Product and Extension handlers based on payment type
 */
class StripeHandlersImpl {
  private readonly productHandlers: StripeProductHandlers
  private readonly extensionHandlers: StripeExtensionHandlers

  constructor(private readonly db: Database) {
    this.productHandlers = new StripeProductHandlers(db)
    this.extensionHandlers = new StripeExtensionHandlers(db)
  }
  /**
   * Cron job handler: Process all deferred payments
   * - Product Deposit: Final payment after deposit
   * - Extension Deposit: Final payment after deposit
   * - Product Installments: Monthly payments
   * - Product Installments Deposit: Monthly payments after deposit
   */
  async handleChargeDeferredPayments() {
    try {
      const [productDeposits, extensionDeposits, productInstallments] =
        await Promise.all([
          this.productHandlers.handleChargeDeferredProductPayments(),
          this.extensionHandlers.handleChargeDeferredExtensionPayments(),
          this.productHandlers.handleChargeProductInstallmentsPayments()
        ])

      return {
        errors: [
          ...productDeposits.errors,
          ...extensionDeposits.errors,
          ...productInstallments.errors
        ],
        processedCount:
          productDeposits.processedCount +
          extensionDeposits.processedCount +
          productInstallments.processedCount,
        successCount:
          productDeposits.successCount +
          extensionDeposits.successCount +
          productInstallments.successCount
      }
    } catch (cause) {
      throw new Error('StripeHandlers handleChargeDeferredPayments error', {
        cause
      })
    }
  }

  /**
   * Webhook handler: payment_intent.succeeded
   * Routes to appropriate handler based on payment product type and link type
   */
  async paymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const metadata =
        paymentIntent.metadata as unknown as PaymentIntentMetadata

      // Skip renewal payments - they're already handled by cron jobs
      if (metadata.isRenewalPayment === 'true') {
        console.log(
          `[Webhook] Skipping renewal payment ${paymentIntent.id} - already processed by cron`
        )
        return
      }

      // Route based on payment product type (Product vs Extension)
      if (metadata.paymentProductType === PaymentProductType.Product) {
        // Product payments
        switch (metadata.type) {
          case PaymentLinkType.Integral:
            await this.productHandlers.handleProductIntegralPayment(
              paymentIntent.id,
              metadata
            )
            break

          case PaymentLinkType.Deposit:
            await this.productHandlers.handleProductDepositPayment(
              paymentIntent.id,
              metadata
            )
            break

          case PaymentLinkType.Installments:
            await this.productHandlers.handleProductInstallmentsPayment(
              paymentIntent,
              metadata
            )
            break

          case PaymentLinkType.InstallmentsDeposit:
            await this.productHandlers.handleProductInstallmentsDepositPayment(
              paymentIntent,
              metadata
            )
            break

          default:
            throw new Error(
              // biome-ignore lint/suspicious/noExplicitAny: <This case should never happen but we need to handle it>
              `Unknown product payment link type: ${(metadata as any).type}`
            )
        }
      } else if (metadata.paymentProductType === PaymentProductType.Extension) {
        // Extension payments
        switch (metadata.type) {
          case PaymentLinkType.Integral:
            await this.extensionHandlers.handleExtensionIntegralPayment(
              paymentIntent.id,
              metadata
            )
            break

          case PaymentLinkType.Deposit:
            await this.extensionHandlers.handleExtensionDepositPayment(
              paymentIntent.id,
              metadata
            )
            break

          case PaymentLinkType.Installments:
            throw new Error('Extension Installments not yet implemented')

          case PaymentLinkType.InstallmentsDeposit:
            throw new Error(
              'Extension Installments Deposit not yet implemented'
            )

          default:
            throw new Error(
              // biome-ignore lint/suspicious/noExplicitAny: <This case should never happen but we need to handle it>
              `Unknown extension payment link type: ${(metadata as any).type}`
            )
        }
      } else {
        throw new Error(
          // biome-ignore lint/suspicious/noExplicitAny: <This case should never happen but we need to handle it>
          `Unknown payment product type: ${(metadata as any).paymentProductType}`
        )
      }
    } catch (cause) {
      throw new Error('StripeHandlers paymentIntentSucceeded error', {
        cause
      })
    }
  }

  async paymentIntentOtherStatus(paymentIntent: Stripe.PaymentIntent) {
    try {
      const metadata =
        paymentIntent.metadata as unknown as PaymentIntentMetadata

      // Skip renewal payments - they're already handled by cron jobs
      if ((metadata as any).isRenewalPayment === 'true') {
        console.log(
          `[Webhook] Skipping renewal payment ${paymentIntent.id} - already processed by cron`
        )
        return
      }

      switch (metadata.paymentProductType) {
        case PaymentProductType.Product:
          await this.productHandlers.updateProductPaymentLinkStatus(
            metadata.productPaymentLinkId,
            paymentIntent.status
          )
          break

        case PaymentProductType.Extension:
          await this.extensionHandlers.updateExtensionPaymentLinkStatus(
            metadata.extensionPaymentLinkId,
            paymentIntent.status
          )
          break

        default:
          throw new Error(
            // biome-ignore lint/suspicious/noExplicitAny: <This case should never happen but we need to handle it>
            `Unknown payment product type: ${(metadata as any).paymentProductType}`
          )
      }
    } catch (cause) {
      throw new Error('StripeHandlers paymentIntentOtherStatus error', {
        cause
      })
    }
  }
}

export const StripeHandlers = new StripeHandlersImpl(database)

export { StripeExtensionHandlers } from './stripe-extension-handlers'
// Also export individual handlers for direct access if needed
export { StripeProductHandlers } from './stripe-product-handlers'
