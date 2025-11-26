import { and, lt, notInArray, sql } from 'drizzle-orm'
import Stripe from 'stripe'
import { type Database, database } from '~/server/database/drizzle'
import {
  extension_payment_links,
  product_payment_links
} from '~/server/database/schema'
import type { PaymentIntentMetadata } from '~/server/services/stripe'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentProductType } from '~/shared/enums/payment-product-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { StripeExtensionHandlers } from './stripe-extension-handlers'
import { StripeProductHandlers } from './stripe-product-handlers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true
})

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

  /**
   * Cron job handler: Cancel expired payment links
   * Finds all payment links where expiresAt < now() and status is pending
   * Cancels the Stripe payment intent and updates the status to Expired
   */
  async handleCancelExpiredPayments() {
    const errors: Array<{ id: string; error: string; type: string }> = []
    let processedCount = 0
    let successCount = 0

    try {
      const now = new Date().toISOString()

      // Statuses that should NOT be cancelled (already terminal states)
      const terminalStatuses = [
        PaymentStatusType.Expired,
        PaymentStatusType.Succeeded,
        PaymentStatusType.Canceled
      ]

      // Query expired product payment links
      const expiredProductLinks = await this.db
        .select({
          id: product_payment_links.id,
          stripePaymentIntentId: product_payment_links.stripePaymentIntentId,
          status: product_payment_links.status,
          expiresAt: product_payment_links.expiresAt
        })
        .from(product_payment_links)
        .where(
          and(
            lt(product_payment_links.expiresAt, now),
            notInArray(product_payment_links.status, terminalStatuses)
          )
        )

      // Query expired extension payment links
      const expiredExtensionLinks = await this.db
        .select({
          id: extension_payment_links.id,
          stripePaymentIntentId: extension_payment_links.stripePaymentIntentId,
          status: extension_payment_links.status,
          expiresAt: extension_payment_links.expiresAt
        })
        .from(extension_payment_links)
        .where(
          and(
            lt(extension_payment_links.expiresAt, now),
            notInArray(extension_payment_links.status, terminalStatuses)
          )
        )

      console.log(
        `[Cron] Found ${expiredProductLinks.length} expired product payment links`
      )
      console.log(
        `[Cron] Found ${expiredExtensionLinks.length} expired extension payment links`
      )

      // Process expired product payment links
      for (const link of expiredProductLinks) {
        processedCount++
        try {
          // Only cancel Stripe payment intent if it exists (TBI payments don't have one)
          if (link.stripePaymentIntentId) {
            await stripe.paymentIntents.cancel(link.stripePaymentIntentId)
          }

          // Update the payment link status to Expired
          await this.db
            .update(product_payment_links)
            .set({ status: PaymentStatusType.Expired })
            .where(sql`${product_payment_links.id} = ${link.id}`)

          successCount++
          console.log(
            `[Cron] Cancelled product payment link ${link.id} (expired at ${link.expiresAt})`
          )
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          errors.push({
            error: errorMessage,
            id: link.id,
            type: 'product'
          })
          console.error(
            `[Cron] Failed to cancel product payment link ${link.id}:`,
            errorMessage
          )
        }
      }

      // Process expired extension payment links
      for (const link of expiredExtensionLinks) {
        processedCount++
        try {
          // Only cancel Stripe payment intent if it exists (TBI payments don't have one)
          if (link.stripePaymentIntentId) {
            await stripe.paymentIntents.cancel(link.stripePaymentIntentId)
          }

          // Update the payment link status to Expired
          await this.db
            .update(extension_payment_links)
            .set({ status: PaymentStatusType.Expired })
            .where(sql`${extension_payment_links.id} = ${link.id}`)

          successCount++
          console.log(
            `[Cron] Cancelled extension payment link ${link.id} (expired at ${link.expiresAt})`
          )
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          errors.push({
            error: errorMessage,
            id: link.id,
            type: 'extension'
          })
          console.error(
            `[Cron] Failed to cancel extension payment link ${link.id}:`,
            errorMessage
          )
        }
      }

      return {
        errors,
        processedCount,
        successCount
      }
    } catch (cause) {
      throw new Error('StripeHandlers handleCancelExpiredPayments error', {
        cause
      })
    }
  }
}

export const StripeHandlers = new StripeHandlersImpl(database)

export { StripeExtensionHandlers } from './stripe-extension-handlers'
// Also export individual handlers for direct access if needed
export { StripeProductHandlers } from './stripe-product-handlers'
