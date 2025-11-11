import type Stripe from 'stripe'
import { database } from '~/server/database/drizzle'
import type { PaymentIntentMetadata } from '~/server/services/stripe'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { StripeExtensionHandlers } from './stripe-extension-handlers'
import { StripeProductHandlers } from './stripe-product-handlers'

const productHandlers = new StripeProductHandlers(database)
const extensionHandlers = new StripeExtensionHandlers(database)

/**
 * Unified Stripe Handlers
 * Orchestrates between Product and Extension handlers based on payment type
 */
class StripeHandlersImpl {
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
          productHandlers.handleChargeDeferredProductPayments(),
          extensionHandlers.handleChargeDeferredExtensionPayments(),
          productHandlers.handleChargeProductInstallmentsPayments()
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
      if ((metadata as any).isRenewalPayment === 'true') {
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
            await productHandlers.handleProductIntegralPayment(
              paymentIntent.id,
              metadata
            )
            break

          case PaymentLinkType.Deposit:
            await productHandlers.handleProductDepositPayment(
              paymentIntent.id,
              metadata
            )
            break

          case PaymentLinkType.Installments:
            await productHandlers.handleProductInstallmentsPayment(
              paymentIntent,
              metadata
            )
            break

          case PaymentLinkType.InstallmentsDeposit:
            await productHandlers.handleProductInstallmentsDepositPayment(
              paymentIntent,
              metadata
            )
            break

          default:
            throw new Error(
              `Unknown product payment link type: ${(metadata as any).type}`
            )
        }
      } else if (
        metadata.paymentProductType === PaymentProductType.Extension
      ) {
        // Extension payments
        switch (metadata.type) {
          case PaymentLinkType.Integral:
            await extensionHandlers.handleExtensionIntegralPayment(
              paymentIntent.id,
              metadata
            )
            break

          case PaymentLinkType.Deposit:
            await extensionHandlers.handleExtensionDepositPayment(
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
              `Unknown extension payment link type: ${(metadata as any).type}`
            )
        }
      } else {
        throw new Error(
          `Unknown payment product type: ${(metadata as any).paymentProductType}`
        )
      }
    } catch (cause) {
      throw new Error('StripeHandlers paymentIntentSucceeded error', {
        cause
      })
    }
  }
}

export const StripeHandlers = new StripeHandlersImpl()

// Also export individual handlers for direct access if needed
export { StripeProductHandlers } from './stripe-product-handlers'
export { StripeExtensionHandlers } from './stripe-extension-handlers'
