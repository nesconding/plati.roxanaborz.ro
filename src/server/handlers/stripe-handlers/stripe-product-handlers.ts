import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import type { Database } from '~/server/database/drizzle'

import * as schema from '~/server/database/schema'
import { DatesService } from '~/server/services/dates'
import {
  type PaymentIntentProductDepositMetadata,
  type PaymentIntentProductInstallmentsDepositMetadata,
  type PaymentIntentProductInstallmentsMetadata,
  type PaymentIntentProductIntegralMetadata,
  StripeService
} from '~/server/services/stripe'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { PaymentStatusType } from '~/shared/enums/payment-status'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

/**
 * Handles all Product payment flows:
 * - Product Integral
 * - Product Deposit
 * - Product Installments
 * - Product Installments Deposit
 */
export class StripeProductHandlers {
  constructor(private readonly db: Database) {}

  /**
   * Updates the status of a product payment link
   * @param paymentLinkId - The ID of the product payment link
   * @param status - The new status of the product payment link
   */
  async updateProductPaymentLinkStatus(
    productPaymentLinkId: string,
    status: PaymentStatusType | `${PaymentStatusType}`
  ) {
    try {
      await this.db
        .update(schema.product_payment_links)
        .set({
          status: status as PaymentStatusType
        })
        .where(eq(schema.product_payment_links.id, productPaymentLinkId))
    } catch (cause) {
      throw new Error(
        'StripeProductHandlers updateProductPaymentLinkStatus error',
        {
          cause
        }
      )
    }
  }

  /**
   * Cron handler: Charge final payment for Product Deposit
   * Called daily for subscriptions where firstPaymentDateAfterDeposit = today
   */
  async handleChargeDeferredProductPayments() {
    try {
      const today = new Date()
      const startOfDay = DatesService.startOfDay(today)
      const endOfDay = DatesService.endOfDay(today)

      // Find all active deposit subscriptions due for payment today
      const subscriptionsDue =
        await this.db.query.product_subscriptions.findMany({
          where: (product_subscriptions, { and, gte, lte, eq }) =>
            and(
              eq(product_subscriptions.status, SubscriptionStatusType.Active),
              eq(product_subscriptions.paymentMethod, PaymentMethodType.Card),
              gte(
                product_subscriptions.nextPaymentDate,
                startOfDay.toISOString()
              ),
              lte(product_subscriptions.nextPaymentDate, endOfDay.toISOString())
            ),
          with: {
            membership: true,
            parentOrder: {
              with: {
                productPaymentLink: true
              }
            }
          }
        })

      // Filter to only plain Deposit types (exclude Installments types)
      const depositSubscriptions = subscriptionsDue.filter(
        (sub) =>
          sub.parentOrder.productPaymentLink.type === PaymentLinkType.Deposit
      )

      const productPayments = await Promise.all(
        depositSubscriptions.map(async (subscription) => {
          const depositPaymentIntent =
            await StripeService.findPaymentIntentById(
              subscription.parentOrder.stripePaymentIntentId
            )

          const metadata =
            depositPaymentIntent.metadata as unknown as PaymentIntentProductDepositMetadata

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

            await this.db.insert(schema.product_orders).values({
              customerEmail: metadata.customerEmail,
              customerName: metadata.customerName,
              productName: metadata.productName,
              productPaymentLinkId: metadata.productPaymentLinkId,
              status: OrderStatusType.Completed,
              stripePaymentIntentId: paymentIntent.id,
              type: OrderType.RenewalOrder
            })

            const newRemainingPayments = subscription.remainingPayments - 1

            // Check if this is the final payment
            if (newRemainingPayments === 0) {
              // Final payment - complete the subscription
              await this.db
                .update(schema.product_subscriptions)
                .set({
                  nextPaymentDate: null,
                  remainingPayments: 0,
                  status: SubscriptionStatusType.Completed
                })
                .where(eq(schema.product_subscriptions.id, subscription.id))
            } else {
              // More payments remaining - just decrement count
              await this.db
                .update(schema.product_subscriptions)
                .set({
                  remainingPayments: newRemainingPayments
                })
                .where(eq(schema.product_subscriptions.id, subscription.id))
            }

            // Activate membership (changes from Delayed to Active)
            await this.db
              .update(schema.memberships)
              .set({
                status: MembershipStatusType.Active
              })
              .where(eq(schema.memberships.id, subscription.membershipId))

            return { success: true }
          } catch (error) {
            console.error(
              `[Cron] Failed to charge deferred payment for payment link ${metadata.productPaymentLinkId}:`,
              error
            )

            await this.db
              .update(schema.product_subscriptions)
              .set({
                status: SubscriptionStatusType.OnHold
              })
              .where(eq(schema.product_subscriptions.id, subscription.id))

            await this.db
              .update(schema.memberships)
              .set({
                status: MembershipStatusType.Paused
              })
              .where(eq(schema.memberships.id, subscription.membershipId))

            return { error, success: false }
          }
        })
      )
      return {
        errors: productPayments
          .filter((payment) => payment.error)
          .map((payment) => payment.error),
        processedCount: productPayments.length,
        successCount: productPayments.filter((payment) => payment.success)
          .length
      }
    } catch (cause) {
      throw new Error(
        'StripeProductHandlers handleChargeDeferredProductPayments error',
        {
          cause
        }
      )
    }
  }

  /**
   * Cron handler: Charge monthly installments for Product Installments & Product Installments Deposit
   * Called daily for subscriptions where nextPaymentDate = today
   */
  async handleChargeProductInstallmentsPayments() {
    try {
      const today = new Date()
      const startOfDay = DatesService.startOfDay(today)
      const endOfDay = DatesService.endOfDay(today)

      // Find all active product subscriptions due for payment today (only card payments can be auto-charged)
      // Note: Only Installments and InstallmentsDeposit - plain Deposit is handled by handleChargeDeferredProductPayments
      const subscriptionsDue =
        await this.db.query.product_subscriptions.findMany({
          where: (product_subscriptions, { and, gte, lte, eq }) =>
            and(
              eq(product_subscriptions.status, SubscriptionStatusType.Active),
              eq(product_subscriptions.paymentMethod, PaymentMethodType.Card),
              gte(
                product_subscriptions.nextPaymentDate,
                startOfDay.toISOString()
              ),
              lte(product_subscriptions.nextPaymentDate, endOfDay.toISOString())
            ),
          with: {
            membership: true,
            parentOrder: {
              with: {
                productPaymentLink: true
              }
            }
          }
        })

      // Filter to only Installments and InstallmentsDeposit types (exclude plain Deposit)
      const installmentSubscriptions = subscriptionsDue.filter(
        (sub) =>
          sub.parentOrder.productPaymentLink.type ===
            PaymentLinkType.Installments ||
          sub.parentOrder.productPaymentLink.type ===
            PaymentLinkType.InstallmentsDeposit
      )

      const payments = await Promise.all(
        installmentSubscriptions.map(async (subscription) => {
          try {
            // Get the original payment intent to extract customer and payment method
            const originalPaymentIntent =
              await StripeService.findPaymentIntentById(
                subscription.parentOrder.stripePaymentIntentId
              )

            if (!originalPaymentIntent.customer) {
              throw new Error(
                `Payment Intent ${originalPaymentIntent.id} does not have a customer attached. Cannot charge installment payment.`
              )
            }

            if (!originalPaymentIntent.payment_method) {
              throw new Error(
                `Payment Intent ${originalPaymentIntent.id} does not have a payment method attached. Cannot charge installment payment.`
              )
            }

            const customerId =
              typeof originalPaymentIntent.customer === 'string'
                ? originalPaymentIntent.customer
                : originalPaymentIntent.customer.id

            const paymentMethodId =
              typeof originalPaymentIntent.payment_method === 'string'
                ? originalPaymentIntent.payment_method
                : originalPaymentIntent.payment_method.id

            const metadata = originalPaymentIntent.metadata as unknown as
              | PaymentIntentProductInstallmentsMetadata
              | PaymentIntentProductInstallmentsDepositMetadata

            // Use remainingInstallmentAmountToPayInCents for InstallmentsDeposit (after deposit deduction)
            // Use productInstallmentAmountToPayInCents for regular Installments
            const installmentAmountInCents = parseInt(
              metadata.type === PaymentLinkType.InstallmentsDeposit
                ? (metadata as PaymentIntentProductInstallmentsDepositMetadata)
                    .remainingInstallmentAmountToPayInCents
                : metadata.productInstallmentAmountToPayInCents,
              10
            )

            // Charge the installment payment
            const paymentIntent = await StripeService.chargeInstallmentPayment({
              customerId,
              metadata,
              paymentMethodId,
              priceAmountInCents: installmentAmountInCents
            })

            // Create renewal order
            await this.db.insert(schema.product_orders).values({
              customerEmail: subscription.customerEmail,
              customerName: subscription.customerName,
              productName: subscription.productName,
              productPaymentLinkId:
                subscription.parentOrder.productPaymentLink.id,
              status: OrderStatusType.Completed,
              stripePaymentIntentId: paymentIntent.id,
              type: OrderType.RenewalOrder
            })

            // If membership is DELAYED (first installment after deposit), activate it
            if (
              subscription.membership.status === MembershipStatusType.Delayed
            ) {
              await this.db
                .update(schema.memberships)
                .set({
                  status: MembershipStatusType.Active
                })
                .where(eq(schema.memberships.id, subscription.membershipId))
            }

            const newRemainingPayments = subscription.remainingPayments - 1

            // Check if this is the final payment
            if (newRemainingPayments === 0) {
              // Final payment - complete the subscription
              await this.db
                .update(schema.product_subscriptions)
                .set({
                  nextPaymentDate: null,
                  remainingPayments: 0,
                  status: SubscriptionStatusType.Completed
                })
                .where(eq(schema.product_subscriptions.id, subscription.id))
            } else {
              // Calculate next payment date (1 month from today)
              const nextPaymentDate = DatesService.addMonths(today, 1)

              await this.db
                .update(schema.product_subscriptions)
                .set({
                  nextPaymentDate: nextPaymentDate.toISOString(),
                  remainingPayments: newRemainingPayments
                })
                .where(eq(schema.product_subscriptions.id, subscription.id))
            }

            return { success: true }
          } catch (error) {
            console.error(
              `[Cron] Failed to charge installment for subscription ${subscription.id}:`,
              error
            )

            // Update subscription to OnHold
            await this.db
              .update(schema.product_subscriptions)
              .set({
                status: SubscriptionStatusType.OnHold
              })
              .where(eq(schema.product_subscriptions.id, subscription.id))

            // Update membership to Paused
            await this.db
              .update(schema.memberships)
              .set({
                status: MembershipStatusType.Paused
              })
              .where(eq(schema.memberships.id, subscription.membershipId))

            return { error, success: false }
          }
        })
      )

      return {
        errors: payments
          .filter((payment) => payment.error)
          .map((payment) => payment.error),
        processedCount: payments.length,
        successCount: payments.filter((payment) => payment.success).length
      }
    } catch (cause) {
      throw new Error(
        'StripeProductHandlers handleChargeProductInstallmentsPayments error',
        {
          cause
        }
      )
    }
  }

  /**
   * Webhook handler: Product Integral payment
   */
  async handleProductIntegralPayment(
    stripePaymentIntentId: string,
    data: PaymentIntentProductIntegralMetadata
  ) {
    const product = await this.db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, data.productId)
    })
    if (!product) throw new Error('Product not found')

    // Update payment link status to succeeded
    await this.updateProductPaymentLinkStatus(
      data.productPaymentLinkId,
      PaymentStatusType.Succeeded
    )

    const [productOrder] = await this.db
      .insert(schema.product_orders)
      .values({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        productName: data.productName,
        productPaymentLinkId: data.productPaymentLinkId,
        status: OrderStatusType.Completed,
        stripePaymentIntentId: stripePaymentIntentId,
        type: OrderType.OneTimePaymentOrder
      })
      .returning()

    const startDate = new Date()
    const endDate = DatesService.addMonths(
      startDate,
      product.membershipDurationMonths
    )
    await this.db.insert(schema.memberships).values({
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      endDate: endDate.toISOString(),
      parentOrderId: productOrder.id,
      productName: data.productName,
      startDate: startDate.toISOString(),
      status: MembershipStatusType.Active
    })
  }

  /**
   * Webhook handler: Product Deposit payment
   */
  async handleProductDepositPayment(
    stripePaymentIntentId: string,
    data: PaymentIntentProductDepositMetadata
  ) {
    const product = await this.db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, data.productId)
    })
    if (!product) throw new Error('Product not found')

    // Update payment link status to succeeded
    await this.updateProductPaymentLinkStatus(
      data.productPaymentLinkId,
      PaymentStatusType.Succeeded
    )

    const [productOrder] = await this.db
      .insert(schema.product_orders)
      .values({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        productName: data.productName,
        productPaymentLinkId: data.productPaymentLinkId,
        status: OrderStatusType.Completed,
        stripePaymentIntentId: stripePaymentIntentId,
        type: OrderType.ParentOrder
      })
      .returning()

    const startDate = data.firstPaymentDateAfterDeposit
    const endDate = DatesService.addMonths(
      startDate,
      product.membershipDurationMonths
    )
    const [membership] = await this.db
      .insert(schema.memberships)
      .values({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        delayedStartDate: data.firstPaymentDateAfterDeposit,
        endDate: endDate.toISOString(),
        parentOrderId: productOrder.id,
        productName: data.productName,
        startDate: startDate,
        status: MembershipStatusType.Delayed
      })
      .returning()

    await this.db.insert(schema.product_subscriptions).values({
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      membershipId: membership.id,
      nextPaymentDate: data.firstPaymentDateAfterDeposit,
      parentOrderId: productOrder.id,
      paymentMethod: data.paymentMethodType,
      productId: data.productId,
      productName: data.productName,
      remainingPayments: 1,
      startDate: new Date().toISOString(),
      status: SubscriptionStatusType.Active
    })
  }

  /**
   * Webhook handler: Product Installments payment
   */
  async handleProductInstallmentsPayment(
    paymentIntent: Stripe.PaymentIntent,
    data: PaymentIntentProductInstallmentsMetadata
  ) {
    const product = await this.db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, data.productId)
    })
    if (!product) throw new Error('Product not found')

    // Update payment link status to succeeded
    await this.updateProductPaymentLinkStatus(
      data.productPaymentLinkId,
      PaymentStatusType.Succeeded
    )

    // Create parent order
    const [productOrder] = await this.db
      .insert(schema.product_orders)
      .values({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        productName: data.productName,
        productPaymentLinkId: data.productPaymentLinkId,
        status: OrderStatusType.Completed,
        stripePaymentIntentId: paymentIntent.id,
        type: OrderType.ParentOrder
      })
      .returning()

    // Create active membership immediately
    const startDate = new Date()
    const endDate = DatesService.addMonths(
      startDate,
      product.membershipDurationMonths
    )
    const [membership] = await this.db
      .insert(schema.memberships)
      .values({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        endDate: endDate.toISOString(),
        parentOrderId: productOrder.id,
        productName: data.productName,
        startDate: startDate.toISOString(),
        status: MembershipStatusType.Active
      })
      .returning()

    // Calculate next payment date (1 month from now)
    const nextPaymentDate = DatesService.addMonths(new Date(), 1)

    // Create product subscription (installments managed via cron, not Stripe subscription)
    await this.db.insert(schema.product_subscriptions).values({
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      membershipId: membership.id,
      nextPaymentDate: nextPaymentDate.toISOString(),
      parentOrderId: productOrder.id,
      paymentMethod: data.paymentMethodType,
      productId: data.productId,
      productName: data.productName,
      remainingPayments: data.productInstallmentsCount - 1, // First installment is already charged
      startDate: new Date().toISOString(),
      status: SubscriptionStatusType.Active
    })
  }

  /**
   * Webhook handler: Product Installments Deposit payment
   */
  async handleProductInstallmentsDepositPayment(
    paymentIntent: Stripe.PaymentIntent,
    data: PaymentIntentProductInstallmentsDepositMetadata
  ) {
    const product = await this.db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, data.productId)
    })
    if (!product) throw new Error('Product not found')

    // Update payment link status to succeeded
    await this.updateProductPaymentLinkStatus(
      data.productPaymentLinkId,
      PaymentStatusType.Succeeded
    )

    // Create parent order for deposit
    const [productOrder] = await this.db
      .insert(schema.product_orders)
      .values({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        productName: data.productName,
        productPaymentLinkId: data.productPaymentLinkId,
        status: OrderStatusType.Completed,
        stripePaymentIntentId: paymentIntent.id,
        type: OrderType.ParentOrder
      })
      .returning()

    // Create delayed membership (starts when first installment is charged)
    const startDate = data.firstPaymentDateAfterDeposit
    const endDate = DatesService.addMonths(
      startDate,
      product.membershipDurationMonths
    )
    const [membership] = await this.db
      .insert(schema.memberships)
      .values({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        delayedStartDate: data.firstPaymentDateAfterDeposit,
        endDate: endDate.toISOString(),
        parentOrderId: productOrder.id,
        productName: data.productName,
        startDate: startDate,
        status: MembershipStatusType.Delayed
      })
      .returning()

    // Create product subscription (will be activated when first installment is charged)
    await this.db.insert(schema.product_subscriptions).values({
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      membershipId: membership.id,
      nextPaymentDate: data.firstPaymentDateAfterDeposit,
      parentOrderId: productOrder.id,
      paymentMethod: data.paymentMethodType,
      productId: data.productId,
      productName: data.productName,
      remainingPayments: data.productInstallmentsCount,
      startDate: new Date().toISOString(),
      status: SubscriptionStatusType.Active
    })
  }
}
