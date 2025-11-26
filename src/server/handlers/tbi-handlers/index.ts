import { eq } from 'drizzle-orm'
import { type Database, database } from '~/server/database/drizzle'
import * as schema from '~/server/database/schema'
import { TbiExtensionHandlers } from './tbi-extension-handlers'
import { TbiProductHandlers } from './tbi-product-handlers'

type PaymentLinkType = 'product' | 'extension'

/**
 * Unified TBI Handlers
 * Orchestrates TBI payment status updates for both products and extensions
 */
class TbiHandlersImpl {
  private readonly productHandlers: TbiProductHandlers
  private readonly extensionHandlers: TbiExtensionHandlers

  constructor(private readonly db: Database) {
    this.productHandlers = new TbiProductHandlers(db)
    this.extensionHandlers = new TbiExtensionHandlers(db)
  }

  /**
   * Determines whether a TBI order ID belongs to a product or extension payment link
   * @returns 'product' | 'extension' | null
   */
  private async determinePaymentLinkType(
    tbiOrderId: string
  ): Promise<PaymentLinkType | null> {
    // Check if it's a product payment link
    const productPaymentLink =
      await this.db.query.product_payment_links.findFirst({
        where: eq(schema.product_payment_links.tbiOrderId, tbiOrderId),
        columns: { id: true }
      })

    if (productPaymentLink) {
      return 'product'
    }

    // Check if it's an extension payment link
    const extensionPaymentLink =
      await this.db.query.extension_payment_links.findFirst({
        where: eq(schema.extension_payment_links.tbiOrderId, tbiOrderId),
        columns: { id: true }
      })

    if (extensionPaymentLink) {
      return 'extension'
    }

    return null
  }

  /**
   * Handle TBI loan approval (status_id = 1)
   * Creates order and activates membership (product) or extends membership (extension)
   */
  async handleApproval(tbiOrderId: string) {
    try {
      const paymentLinkType = await this.determinePaymentLinkType(tbiOrderId)

      if (!paymentLinkType) {
        throw new Error(
          `Payment link not found for TBI order ID: ${tbiOrderId}`
        )
      }

      console.log(
        `[TBI] Handling approval for ${paymentLinkType} payment link with TBI order ${tbiOrderId}`
      )

      if (paymentLinkType === 'product') {
        await this.productHandlers.handleProductApproval(tbiOrderId)
      } else {
        await this.extensionHandlers.handleExtensionApproval(tbiOrderId)
      }
    } catch (cause) {
      throw new Error('TbiHandlers handleApproval error', { cause })
    }
  }

  /**
   * Handle TBI loan rejection/cancellation (status_id = 0)
   * Updates payment link status to PaymentFailed (with reason) or Canceled (without reason)
   */
  async handleRejection(tbiOrderId: string, reason: string) {
    try {
      const paymentLinkType = await this.determinePaymentLinkType(tbiOrderId)

      if (!paymentLinkType) {
        throw new Error(
          `Payment link not found for TBI order ID: ${tbiOrderId}`
        )
      }

      console.log(
        `[TBI] Handling rejection for ${paymentLinkType} payment link with TBI order ${tbiOrderId}`
      )

      if (paymentLinkType === 'product') {
        await this.productHandlers.handleProductRejection(tbiOrderId, reason)
      } else {
        await this.extensionHandlers.handleExtensionRejection(tbiOrderId, reason)
      }
    } catch (cause) {
      throw new Error('TbiHandlers handleRejection error', { cause })
    }
  }

  /**
   * Handle TBI pending status (status_id = 2)
   * Updates payment link status to Processing
   */
  async handlePending(tbiOrderId: string, intermediateStatus: string) {
    try {
      const paymentLinkType = await this.determinePaymentLinkType(tbiOrderId)

      if (!paymentLinkType) {
        throw new Error(
          `Payment link not found for TBI order ID: ${tbiOrderId}`
        )
      }

      console.log(
        `[TBI] Handling pending status for ${paymentLinkType} payment link with TBI order ${tbiOrderId}`
      )

      if (paymentLinkType === 'product') {
        await this.productHandlers.handleProductPending(
          tbiOrderId,
          intermediateStatus
        )
      } else {
        await this.extensionHandlers.handleExtensionPending(
          tbiOrderId,
          intermediateStatus
        )
      }
    } catch (cause) {
      throw new Error('TbiHandlers handlePending error', { cause })
    }
  }
}

export const TbiHandlers = new TbiHandlersImpl(database)
export { TbiExtensionHandlers } from './tbi-extension-handlers'
export { TbiProductHandlers } from './tbi-product-handlers'
