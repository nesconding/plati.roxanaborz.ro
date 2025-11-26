import { eq } from 'drizzle-orm'
import type { Database } from '~/server/database/drizzle'
import * as schema from '~/server/database/schema'
import { DatesService } from '~/server/services/dates'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'

/**
 * Handles TBI Product payment flows
 * Currently only supports Integral payments (TBI handles installments internally)
 */
export class TbiProductHandlers {
  constructor(private readonly db: Database) {}

  /**
   * Updates the status of a product payment link
   */
  async updateProductPaymentLinkStatus(
    productPaymentLinkId: string,
    status: PaymentStatusType
  ) {
    try {
      await this.db
        .update(schema.product_payment_links)
        .set({ status })
        .where(eq(schema.product_payment_links.id, productPaymentLinkId))
    } catch (cause) {
      throw new Error(
        'TbiProductHandlers updateProductPaymentLinkStatus error',
        { cause }
      )
    }
  }

  /**
   * Handle TBI loan approval for a product
   * Creates order and activates membership
   */
  async handleProductApproval(tbiOrderId: string) {
    try {
      // Find the payment link by TBI order ID
      const paymentLink = await this.db.query.product_payment_links.findFirst({
        where: (product_payment_links, { eq }) =>
          eq(product_payment_links.tbiOrderId, tbiOrderId),
        with: {
          product: true
        }
      })

      if (!paymentLink) {
        throw new Error(`Payment link not found for TBI order ID: ${tbiOrderId}`)
      }

      // Update payment link status to succeeded
      await this.updateProductPaymentLinkStatus(
        paymentLink.id,
        PaymentStatusType.Succeeded
      )

      console.log(
        `[TBI Product] Payment link ${paymentLink.id} status updated to Succeeded`
      )

      // Create product order with billing data from payment link
      const [productOrder] = await this.db
        .insert(schema.product_orders)
        .values({
          billingData: paymentLink.billingData,
          customerEmail: paymentLink.customerEmail,
          customerName: paymentLink.customerName,
          productName: paymentLink.productName,
          productPaymentLinkId: paymentLink.id,
          status: OrderStatusType.Completed,
          stripePaymentIntentId: `tbi_${tbiOrderId}`, // Prefix to distinguish from Stripe
          type: OrderType.OneTimePaymentOrder
        })
        .returning()

      // Create membership
      const startDate = new Date()
      const endDate = DatesService.addMonths(
        startDate,
        paymentLink.product.membershipDurationMonths
      )

      const [membership] = await this.db
        .insert(schema.memberships)
        .values({
          customerEmail: paymentLink.customerEmail,
          customerName: paymentLink.customerName,
          endDate: endDate.toISOString(),
          parentOrderId: productOrder.id,
          productName: paymentLink.productName,
          startDate: startDate.toISOString(),
          status: MembershipStatusType.Active
        })
        .returning()

      console.log(
        `[TBI Product] Created order ${productOrder.id} and membership ${membership.id} for TBI order ${tbiOrderId}`
      )
    } catch (cause) {
      throw new Error('TbiProductHandlers handleProductApproval error', {
        cause
      })
    }
  }

  /**
   * Handle TBI loan rejection for a product
   * Updates payment link status to failed
   */
  async handleProductRejection(tbiOrderId: string, reason: string) {
    try {
      // Find the payment link by TBI order ID
      const paymentLink = await this.db.query.product_payment_links.findFirst({
        where: (product_payment_links, { eq }) =>
          eq(product_payment_links.tbiOrderId, tbiOrderId)
      })

      if (!paymentLink) {
        throw new Error(`Payment link not found for TBI order ID: ${tbiOrderId}`)
      }

      // Determine status based on trimmed reason
      // Empty/whitespace-only reason = canceled, with content = rejected
      const hasReason = Boolean(reason?.trim())
      const status = hasReason
        ? PaymentStatusType.PaymentFailed
        : PaymentStatusType.Canceled

      await this.updateProductPaymentLinkStatus(paymentLink.id, status)

      console.log(
        `[TBI Product] Payment link ${paymentLink.id} status updated to ${status}. Reason: "${reason || 'User canceled'}"`
      )
    } catch (cause) {
      throw new Error('TbiProductHandlers handleProductRejection error', {
        cause
      })
    }
  }

  /**
   * Handle TBI pending status for a product
   * Updates payment link status to processing
   */
  async handleProductPending(tbiOrderId: string, intermediateStatus: string) {
    try {
      // Find the payment link by TBI order ID
      const paymentLink = await this.db.query.product_payment_links.findFirst({
        where: (product_payment_links, { eq }) =>
          eq(product_payment_links.tbiOrderId, tbiOrderId)
      })

      if (!paymentLink) {
        throw new Error(`Payment link not found for TBI order ID: ${tbiOrderId}`)
      }

      await this.updateProductPaymentLinkStatus(
        paymentLink.id,
        PaymentStatusType.Processing
      )

      console.log(
        `[TBI Product] Payment link ${paymentLink.id} is pending. Intermediate status: "${intermediateStatus}"`
      )
    } catch (cause) {
      throw new Error('TbiProductHandlers handleProductPending error', {
        cause
      })
    }
  }
}
