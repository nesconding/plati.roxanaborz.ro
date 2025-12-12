import { eq } from 'drizzle-orm'
import type { Database } from '~/server/database/drizzle'

import * as schema from '~/server/database/schema'
import { DatesService } from '~/server/services/dates'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'
import { PaymentLinkType } from '~/shared/enums/payment-link-type'
import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

/**
 * Handles bank transfer payment completion flows:
 * - Product Integral
 * - Product Deposit
 * - Product Installments
 * - Product Installments Deposit
 *
 * This mirrors the StripeProductHandlers but for bank transfer payments
 * where admin manually completes orders.
 */
export class BankTransferProductService {
  constructor(private readonly db: Database) {}

  /**
   * Complete a bank transfer order by creating the membership and subscription
   * based on the payment link type.
   *
   * Called when admin marks order status as "Completed"
   */
  async completeBankTransferOrder(orderId: string): Promise<void> {
    // Fetch the order with payment link and product relations
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

    const { productPaymentLink } = order
    const { product } = productPaymentLink

    // Check if membership/subscription already exists for this order (idempotency)
    const existingMembership = await this.db.query.memberships.findFirst({
      where: (memberships, { eq }) => eq(memberships.parentOrderId, orderId)
    })

    if (existingMembership) {
      console.log(
        `[BankTransfer] Membership already exists for order ${orderId}, skipping creation`
      )
      return
    }

    // Handle based on payment link type
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
        // Default to integral if unknown type
        await this.handleIntegralCompletion(order, product)
    }
  }

  /**
   * Integral: Create active membership, no subscription
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
  }

  /**
   * Deposit: Create delayed membership + subscription (1 remaining payment)
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

    // Create delayed membership
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

    // Create subscription for the remaining payment (1 payment)
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
  }

  /**
   * Installments: Create active membership + subscription (N-1 remaining payments)
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

    // Create active membership immediately
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

    // Calculate next payment date (1 month from now)
    const nextPaymentDate = DatesService.addMonths(new Date(), 1)

    // Create subscription for remaining installments (N-1, first is already paid)
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
    }
  }

  /**
   * InstallmentsDeposit: Create delayed membership + subscription (N remaining payments)
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

    // Create delayed membership (starts when first installment is paid)
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

    // Create subscription for all installments (N payments, deposit is separate)
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
  }
}
