import { eq } from 'drizzle-orm'
import type { Database } from '~/server/database/drizzle'
import * as schema from '~/server/database/schema'
import { DatesService } from '~/server/services/dates'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'

/**
 * Handles TBI Extension payment flows
 * Currently only supports Integral payments (TBI handles installments internally)
 */
export class TbiExtensionHandlers {
  constructor(private readonly db: Database) {}

  /**
   * Updates the status of an extension payment link
   */
  async updateExtensionPaymentLinkStatus(
    extensionPaymentLinkId: string,
    status: PaymentStatusType
  ) {
    try {
      await this.db
        .update(schema.extension_payment_links)
        .set({ status })
        .where(eq(schema.extension_payment_links.id, extensionPaymentLinkId))
    } catch (cause) {
      throw new Error(
        'TbiExtensionHandlers updateExtensionPaymentLinkStatus error',
        { cause }
      )
    }
  }

  /**
   * Handle TBI loan approval for an extension
   * Creates extension order and extends membership
   */
  async handleExtensionApproval(tbiOrderId: string) {
    try {
      // Find the payment link by TBI order ID
      const paymentLink = await this.db.query.extension_payment_links.findFirst(
        {
          where: (extension_payment_links, { eq }) =>
            eq(extension_payment_links.tbiOrderId, tbiOrderId),
          with: {
            extension: true,
            membership: true
          }
        }
      )

      if (!paymentLink) {
        throw new Error(
          `Payment link not found for TBI order ID: ${tbiOrderId}`
        )
      }

      if (!paymentLink.membership) {
        throw new Error(
          `Membership not found for extension payment link: ${paymentLink.id}`
        )
      }

      // Update payment link status to succeeded
      await this.updateExtensionPaymentLinkStatus(
        paymentLink.id,
        PaymentStatusType.Succeeded
      )

      console.log(
        `[TBI Extension] Payment link ${paymentLink.id} status updated to Succeeded`
      )

      // Create extension order
      // Note: Extension payment links don't store billingData, so we don't include it
      const [extensionOrder] = await this.db
        .insert(schema.extension_orders)
        .values({
          customerEmail: paymentLink.customerEmail,
          customerName: paymentLink.customerName,
          extensionPaymentLinkId: paymentLink.id,
          membershipId: paymentLink.membershipId,
          productName: paymentLink.productName,
          status: OrderStatusType.Completed,
          stripePaymentIntentId: `tbi_${tbiOrderId}`, // Prefix to distinguish from Stripe
          type: OrderType.OneTimePaymentOrder
        })
        .returning()

      console.log(
        `[TBI Extension] Created extension order ${extensionOrder.id} for membership ${paymentLink.membershipId}`
      )

      // Extend the membership by adding extension months to current end date
      const currentEndDate = new Date(paymentLink.membership.endDate)
      const newEndDate = DatesService.addMonths(
        currentEndDate,
        paymentLink.extension.extensionMonths
      )

      await this.db
        .update(schema.memberships)
        .set({
          endDate: newEndDate.toISOString()
        })
        .where(eq(schema.memberships.id, paymentLink.membershipId))

      console.log(
        `[TBI Extension] Extended membership ${paymentLink.membershipId} to ${newEndDate.toISOString()}`
      )
    } catch (cause) {
      throw new Error('TbiExtensionHandlers handleExtensionApproval error', {
        cause
      })
    }
  }

  /**
   * Handle TBI loan rejection for an extension
   * Updates payment link status to failed or canceled
   */
  async handleExtensionRejection(tbiOrderId: string, reason: string) {
    try {
      // Find the payment link by TBI order ID
      const paymentLink = await this.db.query.extension_payment_links.findFirst(
        {
          where: (extension_payment_links, { eq }) =>
            eq(extension_payment_links.tbiOrderId, tbiOrderId)
        }
      )

      if (!paymentLink) {
        throw new Error(
          `Payment link not found for TBI order ID: ${tbiOrderId}`
        )
      }

      // Determine status based on trimmed reason
      // Empty/whitespace-only reason = canceled, with content = rejected
      const hasReason = Boolean(reason?.trim())
      const status = hasReason
        ? PaymentStatusType.PaymentFailed
        : PaymentStatusType.Canceled

      await this.updateExtensionPaymentLinkStatus(paymentLink.id, status)

      console.log(
        `[TBI Extension] Payment link ${paymentLink.id} status updated to ${status}. Reason: "${reason || 'User canceled'}"`
      )
    } catch (cause) {
      throw new Error('TbiExtensionHandlers handleExtensionRejection error', {
        cause
      })
    }
  }

  /**
   * Handle TBI pending status for an extension
   * Updates payment link status to processing
   */
  async handleExtensionPending(tbiOrderId: string, intermediateStatus: string) {
    try {
      // Find the payment link by TBI order ID
      const paymentLink = await this.db.query.extension_payment_links.findFirst(
        {
          where: (extension_payment_links, { eq }) =>
            eq(extension_payment_links.tbiOrderId, tbiOrderId)
        }
      )

      if (!paymentLink) {
        throw new Error(
          `Payment link not found for TBI order ID: ${tbiOrderId}`
        )
      }

      await this.updateExtensionPaymentLinkStatus(
        paymentLink.id,
        PaymentStatusType.Processing
      )

      console.log(
        `[TBI Extension] Payment link ${paymentLink.id} is pending. Intermediate status: "${intermediateStatus}"`
      )
    } catch (cause) {
      throw new Error('TbiExtensionHandlers handleExtensionPending error', {
        cause
      })
    }
  }
}
