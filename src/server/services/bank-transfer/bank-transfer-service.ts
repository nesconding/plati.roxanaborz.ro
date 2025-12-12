import type { Database } from '~/server/database/drizzle'
import { BankTransferExtensionHandlers } from './bank-transfer-extension-handlers'
import { BankTransferProductHandlers } from './bank-transfer-product-handlers'

/**
 * Main orchestrator for bank transfer payment completion.
 * Delegates to product or extension handlers based on order type.
 */
export class BankTransferService {
  private readonly productHandlers: BankTransferProductHandlers
  private readonly extensionHandlers: BankTransferExtensionHandlers

  constructor(private readonly db: Database) {
    this.productHandlers = new BankTransferProductHandlers(db)
    this.extensionHandlers = new BankTransferExtensionHandlers(db)
  }

  /**
   * Complete a bank transfer payment for a product order.
   * Handles both initial orders and subscription renewal orders.
   */
  async completeProductBankTransfer(orderId: string): Promise<void> {
    return this.productHandlers.completeOrder(orderId)
  }

  /**
   * Complete a bank transfer payment for an extension order.
   * Handles both initial orders and subscription renewal orders.
   */
  async completeExtensionBankTransfer(orderId: string): Promise<void> {
    return this.extensionHandlers.completeOrder(orderId)
  }
}
