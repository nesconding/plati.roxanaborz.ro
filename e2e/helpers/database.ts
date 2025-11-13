import { eq } from 'drizzle-orm'
import { database as db } from '~/server/database/drizzle'
import {
  contracts,
  extension_orders,
  extension_payment_links,
  extension_subscriptions,
  memberships,
  product_orders,
  product_payment_links,
  product_subscriptions,
  products,
  products_extensions,
  products_installments,
  users
} from '~/server/database/schema'
import { UserRoles } from '~/shared/enums/user-roles'

/**
 * E2E Database Helpers
 * Functions to set up and clean up test data for e2e tests
 */

export class E2EDatabase {
  /**
   * Clean up all test data created during e2e tests
   */
  static async cleanup() {
    // Delete in correct order to handle foreign key constraints
    await db.delete(extension_subscriptions)
    await db.delete(product_subscriptions)
    await db.delete(memberships)
    await db.delete(extension_orders)
    await db.delete(product_orders)
    await db.delete(extension_payment_links)
    await db.delete(product_payment_links)
    await db.delete(products_installments)
    await db.delete(products_extensions)
    await db.delete(products)
    await db.delete(contracts)
    // Don't delete users as they may be needed across tests
  }

  /**
   * Create a test user
   */
  static async createTestUser(data: {
    id: string
    email: string
    name: string
    role?: UserRoles
  }) {
    const [user] = await db
      .insert(users)
      .values({
        createdAt: new Date().toISOString(),
        email: data.email,
        emailVerified: true,
        id: data.id,
        name: data.name,
        role: data.role || UserRoles.USER,
        updatedAt: new Date().toISOString()
      })
      .returning()
    return user
  }

  /**
   * Create a test product
   */
  static async createTestProduct(data: {
    id: string
    name: string
    price: string
    membershipDurationMonths: number
    isDepositAmountEnabled?: boolean
    minDepositAmount?: string
  }) {
    const [product] = await db
      .insert(products)
      .values({
        createdAt: new Date().toISOString(),
        deletedAt: null,
        id: data.id,
        isDepositAmountEnabled: data.isDepositAmountEnabled ?? false,
        membershipDurationMonths: data.membershipDurationMonths,
        minDepositAmount: data.minDepositAmount ?? '0',
        name: data.name,
        price: data.price,
        updatedAt: new Date().toISOString()
      })
      .returning()
    return product
  }

  /**
   * Create a test contract
   */
  static async createTestContract(data: { id: string; createdById: string }) {
    const [contract] = await db
      .insert(contracts)
      .values({
        createdAt: new Date().toISOString(),
        createdById: data.createdById,
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        deletedAt: null,
        id: data.id,
        updatedAt: new Date().toISOString()
      })
      .returning()
    return contract
  }

  /**
   * Create a test extension
   */
  static async createTestExtension(data: {
    id: string
    productId: string
    price: string
    extensionMonths: number
  }) {
    const [extension] = await db
      .insert(products_extensions)
      .values({
        createdAt: new Date().toISOString(),
        deletedAt: null,
        extensionMonths: data.extensionMonths,
        id: data.id,
        isDepositAmountEnabled: false,
        minDepositAmount: '0',
        price: data.price,
        productId: data.productId,
        updatedAt: new Date().toISOString()
      })
      .returning()
    return extension
  }

  /**
   * Get payment link by ID
   */
  static async getProductPaymentLink(id: string) {
    return db.query.product_payment_links.findFirst({
      where: eq(product_payment_links.id, id)
    })
  }

  /**
   * Get extension payment link by ID
   */
  static async getExtensionPaymentLink(id: string) {
    return db.query.extension_payment_links.findFirst({
      where: eq(extension_payment_links.id, id)
    })
  }

  /**
   * Get order by payment link ID
   */
  static async getOrderByPaymentLinkId(paymentLinkId: string) {
    return db.query.product_orders.findFirst({
      where: eq(product_orders.productPaymentLinkId, paymentLinkId)
    })
  }

  /**
   * Get membership by order ID
   */
  static async getMembershipByOrderId(orderId: string) {
    return db.query.memberships.findFirst({
      where: eq(memberships.parentOrderId, orderId)
    })
  }

  /**
   * Get subscriptions by payment link ID
   */
  static async getSubscriptionsByPaymentLinkId(paymentLinkId: string) {
    // Query through relationship: payment_link → order → subscription
    const order = await db.query.product_orders.findFirst({
      where: eq(product_orders.productPaymentLinkId, paymentLinkId)
    })

    if (!order) return []

    return db.query.product_subscriptions.findMany({
      where: eq(product_subscriptions.parentOrderId, order.id)
    })
  }

  /**
   * Get all users (for security testing)
   */
  static async getAllUsers() {
    return db.query.users.findMany()
  }
}
