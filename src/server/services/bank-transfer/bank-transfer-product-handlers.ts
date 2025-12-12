import { eq } from 'drizzle-orm'
import type { Database } from '~/server/database/drizzle'
import * as schema from '~/server/database/schema'
import { DatesService } from '~/server/services/dates'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { OrderStatusType } from '~/shared/enums/order-status-type'
import { OrderType } from '~/shared/enums/order-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

/**
 * Handles bank transfer payment completion for product orders.
 * Supports both initial orders (ParentOrder/OneTimePaymentOrder) and
 * renewal orders (RenewalOrder) for subscriptions.
 */
export class BankTransferProductHandlers {
  constructor(private readonly db: Database) {}

  /**
   * Complete a product bank transfer order by creating/updating
   * membership and subscription based on order type and payment link type.
   */
  async completeOrder(orderId: string): Promise<void> {
    const order = await this.db.query.product_orders.findFirst({
      where: (product_orders, { eq }) => eq(product_orders.id, orderId),
      with: {
        productPaymentLink: {
          with: {
            product: true
          }
        }
      }
    })

    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    if (!order.productPaymentLink) {
      throw new Error(`Payment link not found for order: ${orderId}`)
    }

    if (!order.productPaymentLink.product) {
      throw new Error(`Product not found for order: ${orderId}`)
    }

    // Check if this is a subsequent payment (subscription already exists)
    const existingSubscription =
      await this.db.query.product_subscriptions.findFirst({
        where: (product_subscriptions, { and, eq }) =>
          and(
            eq(product_subscriptions.parentOrderId, orderId),
            eq(product_subscriptions.status, SubscriptionStatusType.Active)
          )
      })

    if (existingSubscription && existingSubscription.remainingPayments > 0) {
      // Subsequent payment - decrement remaining payments
      await this.handleSubsequentPayment(existingSubscription)
      return
    }

    // First payment - create membership and subscription
    if (
      order.type === OrderType.ParentOrder ||
      order.type === OrderType.OneTimePaymentOrder
    ) {
      await this.handleInitialOrder(order)
    } else if (order.type === OrderType.RenewalOrder) {
      await this.handleRenewalOrder(order)
    } else {
      // Default to initial order handling for unknown types
      await this.handleInitialOrder(order)
    }
  }

  /**
   * Handle initial product order (first payment)
   */
  private async handleInitialOrder(order: {
    customerEmail: string
    customerName: string | null
    id: string
    productName: string
    productPaymentLink: {
      firstPaymentDateAfterDeposit: string | null
      product: {
        id: string
        membershipDurationMonths: number
      }
      productId: string
      productInstallmentsCount: number | null
      type: string
    }
  }): Promise<void> {
    // Check if membership already exists for this order (idempotency)
    const existingMembership = await this.db.query.memberships.findFirst({
      where: (memberships, { eq }) => eq(memberships.parentOrderId, order.id)
    })

    if (existingMembership) {
      console.log(
        `[BankTransfer] Membership already exists for order ${order.id}, skipping creation`
      )
      return
    }

    const { productPaymentLink } = order
    const { product } = productPaymentLink

    switch (productPaymentLink.type) {
      case PaymentLinkType.Integral:
        await this.handleIntegralCompletion(order, product)
        break

      case PaymentLinkType.Deposit:
        await this.handleDepositCompletion(order, productPaymentLink, product)
        break

      case PaymentLinkType.Installments:
        await this.handleInstallmentsCompletion(
          order,
          productPaymentLink,
          product
        )
        break

      case PaymentLinkType.InstallmentsDeposit:
        await this.handleInstallmentsDepositCompletion(
          order,
          productPaymentLink,
          product
        )
        break

      default:
        await this.handleIntegralCompletion(order, product)
    }
  }

  /**
   * Handle renewal order (subscription payment)
   * Decrements remaining payments and activates delayed membership if final payment
   * Updates parent order status to Completed when all payments are done
   */
  private async handleRenewalOrder(order: {
    id: string
    productPaymentLinkId: string | null
  }): Promise<void> {
    // Find the subscription associated with this order's payment link
    const subscription = await this.db.query.product_subscriptions.findFirst({
      where: (product_subscriptions, { and, eq }) =>
        and(
          eq(product_subscriptions.status, SubscriptionStatusType.Active),
          eq(
            product_subscriptions.paymentMethod,
            PaymentMethodType.BankTransfer
          )
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

    // If no subscription found by status, try to find by payment link
    let targetSubscription = subscription
    if (!targetSubscription && order.productPaymentLinkId) {
      const subscriptionByPaymentLink =
        await this.db.query.product_subscriptions.findFirst({
          where: (product_subscriptions, { eq }) =>
            eq(product_subscriptions.status, SubscriptionStatusType.Active),
          with: {
            membership: true,
            parentOrder: {
              with: {
                productPaymentLink: true
              }
            }
          }
        })

      if (
        subscriptionByPaymentLink?.parentOrder.productPaymentLink.id ===
        order.productPaymentLinkId
      ) {
        targetSubscription = subscriptionByPaymentLink
      }
    }

    if (!targetSubscription) {
      console.log(
        `[BankTransfer] No active subscription found for renewal order ${order.id}`
      )
      return
    }

    // Mark current renewal order as completed
    await this.db
      .update(schema.product_orders)
      .set({ status: OrderStatusType.Completed })
      .where(eq(schema.product_orders.id, order.id))

    const newRemainingPayments = targetSubscription.remainingPayments - 1

    if (newRemainingPayments === 0) {
      // Final payment - complete the subscription
      await this.db
        .update(schema.product_subscriptions)
        .set({
          nextPaymentDate: null,
          remainingPayments: 0,
          status: SubscriptionStatusType.Completed
        })
        .where(eq(schema.product_subscriptions.id, targetSubscription.id))

      // Activate delayed membership if exists
      if (
        targetSubscription.membershipId &&
        targetSubscription.membership?.status === MembershipStatusType.Delayed
      ) {
        await this.db
          .update(schema.memberships)
          .set({
            status: MembershipStatusType.Active
          })
          .where(eq(schema.memberships.id, targetSubscription.membershipId))
      }

      // Mark parent order as completed (all payments done)
      await this.db
        .update(schema.product_orders)
        .set({ status: OrderStatusType.Completed })
        .where(eq(schema.product_orders.id, targetSubscription.parentOrderId))
    } else {
      // More payments remaining - decrement and update next payment date
      const nextPaymentDate = DatesService.addMonths(new Date(), 1)

      await this.db
        .update(schema.product_subscriptions)
        .set({
          nextPaymentDate: nextPaymentDate.toISOString(),
          remainingPayments: newRemainingPayments
        })
        .where(eq(schema.product_subscriptions.id, targetSubscription.id))

      // Activate delayed membership on first installment payment (for InstallmentsDeposit)
      if (
        targetSubscription.membershipId &&
        targetSubscription.membership?.status === MembershipStatusType.Delayed
      ) {
        await this.db
          .update(schema.memberships)
          .set({
            status: MembershipStatusType.Active
          })
          .where(eq(schema.memberships.id, targetSubscription.membershipId))
      }
    }
  }

  /**
   * Handle subsequent payment on existing subscription
   * Decrements remaining payments and completes subscription if final payment
   * Activates delayed membership on first subsequent payment (for InstallmentsDeposit)
   */
  private async handleSubsequentPayment(subscription: {
    id: string
    membershipId: string | null
    parentOrderId: string
    remainingPayments: number
  }): Promise<void> {
    // Activate delayed membership on first subsequent payment (for InstallmentsDeposit)
    const { membershipId } = subscription
    if (membershipId) {
      const membership = await this.db.query.memberships.findFirst({
        where: (memberships, { eq }) => eq(memberships.id, membershipId)
      })

      if (membership?.status === MembershipStatusType.Delayed) {
        await this.db
          .update(schema.memberships)
          .set({ status: MembershipStatusType.Active })
          .where(eq(schema.memberships.id, membershipId))
      }
    }

    const newRemainingPayments = subscription.remainingPayments - 1

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

      // Mark parent order as completed (all payments done)
      await this.db
        .update(schema.product_orders)
        .set({ status: OrderStatusType.Completed })
        .where(eq(schema.product_orders.id, subscription.parentOrderId))
    } else {
      // More payments remaining - decrement and update next payment date
      const nextPaymentDate = DatesService.addMonths(new Date(), 1)

      await this.db
        .update(schema.product_subscriptions)
        .set({
          nextPaymentDate: nextPaymentDate.toISOString(),
          remainingPayments: newRemainingPayments
        })
        .where(eq(schema.product_subscriptions.id, subscription.id))
    }
  }

  /**
   * Integral: Create active membership, no subscription
   * Order is completed immediately (single payment)
   */
  private async handleIntegralCompletion(
    order: {
      customerEmail: string
      customerName: string | null
      id: string
      productName: string
    },
    product: {
      membershipDurationMonths: number
    }
  ): Promise<void> {
    const startDate = new Date()
    const endDate = DatesService.addMonths(
      startDate,
      product.membershipDurationMonths
    )

    await this.db.insert(schema.memberships).values({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      endDate: endDate.toISOString(),
      parentOrderId: order.id,
      productName: order.productName,
      startDate: startDate.toISOString(),
      status: MembershipStatusType.Active
    })

    // Single payment - order is completed
    await this.db
      .update(schema.product_orders)
      .set({ status: OrderStatusType.Completed })
      .where(eq(schema.product_orders.id, order.id))
  }

  /**
   * Deposit: Create delayed membership + subscription (1 remaining payment)
   * Order is processing until final payment
   */
  private async handleDepositCompletion(
    order: {
      customerEmail: string
      customerName: string | null
      id: string
      productName: string
    },
    paymentLink: {
      firstPaymentDateAfterDeposit: string | null
      productId: string
    },
    product: {
      id: string
      membershipDurationMonths: number
    }
  ): Promise<void> {
    if (!paymentLink.firstPaymentDateAfterDeposit) {
      throw new Error(
        'firstPaymentDateAfterDeposit is required for deposit payments'
      )
    }

    const startDate = paymentLink.firstPaymentDateAfterDeposit
    const endDate = DatesService.addMonths(
      startDate,
      product.membershipDurationMonths
    )

    const [membership] = await this.db
      .insert(schema.memberships)
      .values({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        delayedStartDate: paymentLink.firstPaymentDateAfterDeposit,
        endDate: endDate.toISOString(),
        parentOrderId: order.id,
        productName: order.productName,
        startDate: startDate,
        status: MembershipStatusType.Delayed
      })
      .returning()

    await this.db.insert(schema.product_subscriptions).values({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      membershipId: membership.id,
      nextPaymentDate: paymentLink.firstPaymentDateAfterDeposit,
      parentOrderId: order.id,
      paymentMethod: PaymentMethodType.BankTransfer,
      productId: product.id,
      productName: order.productName,
      remainingPayments: 1,
      startDate: new Date().toISOString(),
      status: SubscriptionStatusType.Active
    })

    // More payments pending - order is processing
    await this.db
      .update(schema.product_orders)
      .set({ status: OrderStatusType.ProcessingBankTransferPayment })
      .where(eq(schema.product_orders.id, order.id))
  }

  /**
   * Installments: Create active membership + subscription (N-1 remaining payments)
   * Order is processing until all payments done, or completed if single installment
   */
  private async handleInstallmentsCompletion(
    order: {
      customerEmail: string
      customerName: string | null
      id: string
      productName: string
    },
    paymentLink: {
      productId: string
      productInstallmentsCount: number | null
    },
    product: {
      id: string
      membershipDurationMonths: number
    }
  ): Promise<void> {
    const installmentsCount = paymentLink.productInstallmentsCount ?? 1

    const startDate = new Date()
    const endDate = DatesService.addMonths(
      startDate,
      product.membershipDurationMonths
    )

    const [membership] = await this.db
      .insert(schema.memberships)
      .values({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        endDate: endDate.toISOString(),
        parentOrderId: order.id,
        productName: order.productName,
        startDate: startDate.toISOString(),
        status: MembershipStatusType.Active
      })
      .returning()

    const nextPaymentDate = DatesService.addMonths(new Date(), 1)
    const remainingPayments = installmentsCount - 1

    if (remainingPayments > 0) {
      await this.db.insert(schema.product_subscriptions).values({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        membershipId: membership.id,
        nextPaymentDate: nextPaymentDate.toISOString(),
        parentOrderId: order.id,
        paymentMethod: PaymentMethodType.BankTransfer,
        productId: product.id,
        productName: order.productName,
        remainingPayments,
        startDate: new Date().toISOString(),
        status: SubscriptionStatusType.Active
      })

      // More payments pending - order is processing
      await this.db
        .update(schema.product_orders)
        .set({ status: OrderStatusType.ProcessingBankTransferPayment })
        .where(eq(schema.product_orders.id, order.id))
    } else {
      // Single installment (n=1) - order is completed
      await this.db
        .update(schema.product_orders)
        .set({ status: OrderStatusType.Completed })
        .where(eq(schema.product_orders.id, order.id))
    }
  }

  /**
   * InstallmentsDeposit: Create delayed membership + subscription (N remaining payments)
   * Order is processing until all payments done
   */
  private async handleInstallmentsDepositCompletion(
    order: {
      customerEmail: string
      customerName: string | null
      id: string
      productName: string
    },
    paymentLink: {
      firstPaymentDateAfterDeposit: string | null
      productId: string
      productInstallmentsCount: number | null
    },
    product: {
      id: string
      membershipDurationMonths: number
    }
  ): Promise<void> {
    if (!paymentLink.firstPaymentDateAfterDeposit) {
      throw new Error(
        'firstPaymentDateAfterDeposit is required for installments deposit payments'
      )
    }

    const installmentsCount = paymentLink.productInstallmentsCount ?? 1

    const startDate = paymentLink.firstPaymentDateAfterDeposit
    const endDate = DatesService.addMonths(
      startDate,
      product.membershipDurationMonths
    )

    const [membership] = await this.db
      .insert(schema.memberships)
      .values({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        delayedStartDate: paymentLink.firstPaymentDateAfterDeposit,
        endDate: endDate.toISOString(),
        parentOrderId: order.id,
        productName: order.productName,
        startDate: startDate,
        status: MembershipStatusType.Delayed
      })
      .returning()

    await this.db.insert(schema.product_subscriptions).values({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      membershipId: membership.id,
      nextPaymentDate: paymentLink.firstPaymentDateAfterDeposit,
      parentOrderId: order.id,
      paymentMethod: PaymentMethodType.BankTransfer,
      productId: product.id,
      productName: order.productName,
      remainingPayments: installmentsCount,
      startDate: new Date().toISOString(),
      status: SubscriptionStatusType.Active
    })

    // More payments pending - order is processing
    await this.db
      .update(schema.product_orders)
      .set({ status: OrderStatusType.ProcessingBankTransferPayment })
      .where(eq(schema.product_orders.id, order.id))
  }
}
