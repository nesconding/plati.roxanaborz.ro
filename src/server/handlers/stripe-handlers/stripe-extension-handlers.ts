import { eq } from 'drizzle-orm'
import type { Database } from '~/server/database/drizzle'
import * as schema from '~/server/database/schema'
import { DatesService } from '~/server/services/dates'
import {
  type PaymentIntentExtensionDepositMetadata,
  type PaymentIntentExtensionIntegralMetadata,
  StripeService
} from '~/server/services/stripe'
import { SubscriptionMembershipSyncService } from '~/server/services/subscription-membership-sync'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import type { PaymentStatusType } from '~/shared/enums/payment-status'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

/**
 * Handles all Extension payment flows:
 * - Extension Integral
 * - Extension Deposit
 * (Extension Installments and Extension Installments Deposit not yet implemented)
 */
export class StripeExtensionHandlers {
  private readonly subscriptionMembershipSyncService: SubscriptionMembershipSyncService
  constructor(private readonly db: Database) {
    this.subscriptionMembershipSyncService =
      new SubscriptionMembershipSyncService(db)
  }

  /**
   * Updates the status of an extension payment link
   * @param extensionPaymentLinkId - The ID of the extension payment link
   * @param status - The new status of the extension payment link
   */
  async updateExtensionPaymentLinkStatus(
    extensionPaymentLinkId: string,
    status: PaymentStatusType | `${PaymentStatusType}`
  ) {
    try {
      await this.db
        .update(schema.extension_payment_links)
        .set({
          status: status as PaymentStatusType
        })
        .where(eq(schema.extension_payment_links.id, extensionPaymentLinkId))
    } catch (cause) {
      throw new Error(
        'StripeExtensionHandlers updateExtensionPaymentLinkStatus error',
        {
          cause
        }
      )
    }
  }

  /**
   * Cron handler: Charge final payment for Extension Deposit
   * Called daily for subscriptions where firstPaymentDateAfterDeposit = today
   */
  async handleChargeDeferredExtensionPayments() {
    try {
      const today = new Date()
      const startOfDay = DatesService.startOfDay(today)
      const endOfDay = DatesService.endOfDay(today)

      // Find all active extension subscriptions due for payment today
      const subscriptionsDue =
        await this.db.query.extension_subscriptions.findMany({
          where: (extension_subscriptions, { and, gte, lte, eq }) =>
            and(
              eq(extension_subscriptions.status, SubscriptionStatusType.Active),
              eq(extension_subscriptions.paymentMethod, PaymentMethodType.Card),
              gte(
                extension_subscriptions.nextPaymentDate,
                startOfDay.toISOString()
              ),
              lte(
                extension_subscriptions.nextPaymentDate,
                endOfDay.toISOString()
              )
            ),
          with: {
            membership: true,
            parentOrder: {
              with: {
                extensionPaymentLink: {
                  with: {
                    extension: true
                  }
                }
              }
            }
          }
        })

      const extensionPayments = await Promise.all(
        subscriptionsDue.map(async (subscription) => {
          const depositPaymentIntent =
            await StripeService.findPaymentIntentById(
              subscription.parentOrder.stripePaymentIntentId
            )

          const metadata =
            depositPaymentIntent.metadata as unknown as PaymentIntentExtensionDepositMetadata

          const extension =
            subscription.parentOrder.extensionPaymentLink.extension

          try {
            if (!depositPaymentIntent.customer) {
              throw new Error(
                `Payment Intent ${depositPaymentIntent.id} does not have a customer attached. Cannot charge deferred payment.`
              )
            }

            if (!depositPaymentIntent.payment_method) {
              throw new Error(
                `Payment Intent ${depositPaymentIntent.id} does not have a payment method attached. Cannot charge deferred payment.`
              )
            }

            const paymentIntent = await StripeService.chargeDeferredPayment({
              metadata,
              payment: {
                amountInCents: metadata.remainingAmountToPayInCents,
                customerId:
                  typeof depositPaymentIntent.customer === 'string'
                    ? depositPaymentIntent.customer
                    : depositPaymentIntent.customer.id,
                paymentMethodId:
                  typeof depositPaymentIntent.payment_method === 'string'
                    ? depositPaymentIntent.payment_method
                    : depositPaymentIntent.payment_method.id
              }
            })

            await this.db.insert(schema.extension_orders).values({
              customerEmail: metadata.customerEmail,
              customerName: metadata.customerName,
              extensionPaymentLinkId: metadata.extensionPaymentLinkId,
              membershipId: metadata.membershipId,
              productName: metadata.productName,
              status: OrderStatusType.Completed,
              stripePaymentIntentId: paymentIntent.id,
              type: OrderType.RenewalOrder
            })

            const newRemainingPayments = subscription.remainingPayments - 1

            // Check if this is the final payment
            if (newRemainingPayments === 0) {
              // Final payment - complete the subscription
              await this.db
                .update(schema.extension_subscriptions)
                .set({
                  nextPaymentDate: null,
                  remainingPayments: 0,
                  status: SubscriptionStatusType.Completed
                })
                .where(eq(schema.extension_subscriptions.id, subscription.id))

              // Extend membership end date
              if (subscription.membership && subscription.membershipId) {
                await this.db
                  .update(schema.memberships)
                  .set({
                    endDate: DatesService.addMonths(
                      subscription.membership.endDate,
                      extension.extensionMonths
                    ).toISOString(),
                    status: MembershipStatusType.Active
                  })
                  .where(eq(schema.memberships.id, subscription.membershipId))
              }
            } else {
              // More payments remaining - just decrement count
              await this.db
                .update(schema.extension_subscriptions)
                .set({
                  remainingPayments: newRemainingPayments
                })
                .where(eq(schema.extension_subscriptions.id, subscription.id))
            }

            // Payment succeeded - reset failure count
            await this.subscriptionMembershipSyncService.handlePaymentSuccess(
              subscription.id,
              'extension',
              newRemainingPayments,
              null
            )

            return { success: true }
          } catch (error) {
            console.error(
              `[Cron] Failed to charge deferred extension payment for payment link ${metadata.extensionPaymentLinkId}:`,
              error
            )

            // Handle payment failure with retry logic
            const failureReason =
              error instanceof Error ? error.message : 'Unknown error'
            const { shouldRetry, failureCount } =
              await this.subscriptionMembershipSyncService.handlePaymentFailure(
                subscription.id,
                'extension',
                failureReason
              )

            console.log(
              `[Cron] Payment failure for extension subscription ${subscription.id}. Attempt ${failureCount}/${3}. Will retry: ${shouldRetry}`
            )

            return { error, success: false }
          }
        })
      )
      return {
        errors: extensionPayments
          .filter((payment) => payment.error)
          .map((payment) => payment.error),
        processedCount: extensionPayments.length,
        successCount: extensionPayments.filter((payment) => payment.success)
          .length
      }
    } catch (cause) {
      throw new Error(
        'StripeExtensionHandlers handleChargeDeferredExtensionPayments error',
        {
          cause
        }
      )
    }
  }

  /**
   * Webhook handler: Extension Integral payment
   */
  async handleExtensionIntegralPayment(
    stripePaymentIntentId: string,
    data: PaymentIntentExtensionIntegralMetadata
  ) {
    const [extension, membership] = await Promise.all([
      this.db.query.products_extensions.findFirst({
        where: (products_extensions, { eq }) =>
          eq(products_extensions.id, data.extensionId)
      }),
      this.db.query.memberships.findFirst({
        where: (memberships, { eq }) => eq(memberships.id, data.membershipId)
      })
    ])
    if (!extension) throw new Error('Extension not found')
    if (!membership) throw new Error('Membership not found')

    const endDate = DatesService.addMonths(
      membership.endDate,
      extension.extensionMonths
    )

    await Promise.all([
      this.db.insert(schema.extension_orders).values({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        extensionPaymentLinkId: data.extensionPaymentLinkId,
        membershipId: data.membershipId,
        productName: data.productName,
        status: OrderStatusType.Completed,
        stripePaymentIntentId: stripePaymentIntentId,
        type: OrderType.OneTimePaymentOrder
      }),
      this.db
        .update(schema.memberships)
        .set({
          endDate: endDate.toISOString()
        })
        .where(eq(schema.memberships.id, data.membershipId))
    ])
  }

  /**
   * Webhook handler: Extension Deposit payment
   */
  async handleExtensionDepositPayment(
    stripePaymentIntentId: string,
    data: PaymentIntentExtensionDepositMetadata
  ) {
    const extension = await this.db.query.products_extensions.findFirst({
      where: (products_extensions, { eq }) =>
        eq(products_extensions.id, data.extensionId)
    })
    if (!extension) throw new Error('Extension not found')

    const [extensionOrder] = await this.db
      .insert(schema.extension_orders)
      .values({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        extensionPaymentLinkId: data.extensionPaymentLinkId,
        membershipId: data.membershipId,
        productName: data.productName,
        status: OrderStatusType.Completed,
        stripePaymentIntentId: stripePaymentIntentId,
        type: OrderType.ParentOrder
      })
      .returning()

    await this.db.insert(schema.extension_subscriptions).values({
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      extensionId: data.extensionId,
      membershipId: data.membershipId,
      nextPaymentDate: data.firstPaymentDateAfterDeposit,
      parentOrderId: extensionOrder.id,
      paymentMethod: data.paymentMethodType,
      productName: data.productName,
      remainingPayments: 1,
      startDate: new Date().toISOString(),
      status: SubscriptionStatusType.Active
    })
  }
}
