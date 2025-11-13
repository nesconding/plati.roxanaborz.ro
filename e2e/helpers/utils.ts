import { Page, expect } from '@playwright/test'

/**
 * E2E Test Utilities
 * Common utility functions for e2e tests
 */

export class E2EUtils {
  /**
   * Wait for an element to be visible
   */
  static async waitForElement(page: Page, selector: string, timeout = 5000) {
    await page.waitForSelector(selector, { state: 'visible', timeout })
  }

  /**
   * Fill in a Stripe card element
   * Note: This requires special handling as Stripe Elements are in iframes
   */
  static async fillStripeCard(
    page: Page,
    cardDetails: {
      number: string
      expiry: string
      cvc: string
      zip?: string
    }
  ) {
    // Wait for Stripe iframe to load
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]')

    // Fill card number
    await stripeFrame
      .locator('[name="cardnumber"]')
      .fill(cardDetails.number)

    // Fill expiry
    await stripeFrame.locator('[name="exp-date"]').fill(cardDetails.expiry)

    // Fill CVC
    await stripeFrame.locator('[name="cvc"]').fill(cardDetails.cvc)

    // Fill ZIP if provided
    if (cardDetails.zip) {
      await stripeFrame.locator('[name="postal"]').fill(cardDetails.zip)
    }
  }

  /**
   * Submit payment form
   */
  static async submitPayment(page: Page) {
    await page.click('button[type="submit"]')
  }

  /**
   * Wait for payment to complete
   */
  static async waitForPaymentSuccess(page: Page, timeout = 30000) {
    // Wait for success URL or success message
    await page.waitForURL('**/callback?*redirect_status=succeeded*', {
      timeout
    })
  }

  /**
   * Wait for payment to fail
   */
  static async waitForPaymentFailure(page: Page, timeout = 10000) {
    // Look for error message
    await page.waitForSelector('[data-testid="payment-error"]', {
      state: 'visible',
      timeout
    })
  }

  /**
   * Generate a unique test ID
   */
  static generateTestId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: string | number, currency = 'RON'): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency
    }).format(numAmount)
  }

  /**
   * Convert amount to cents
   */
  static toCents(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return Math.round(numAmount * 100).toString()
  }

  /**
   * Convert cents to amount
   */
  static fromCents(cents: string | number): string {
    const numCents = typeof cents === 'string' ? parseInt(cents) : cents
    return (numCents / 100).toFixed(2)
  }

  /**
   * Take a screenshot with a descriptive name
   */
  static async screenshot(page: Page, name: string) {
    await page.screenshot({
      path: `e2e-screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    })
  }

  /**
   * Wait for API response
   */
  static async waitForAPIResponse(
    page: Page,
    urlPattern: string | RegExp,
    timeout = 10000
  ) {
    return await page.waitForResponse(
      response => {
        const url = response.url()
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern)
        }
        return urlPattern.test(url)
      },
      { timeout }
    )
  }

  /**
   * Check if an element contains text
   */
  static async expectTextContent(
    page: Page,
    selector: string,
    expectedText: string
  ) {
    const element = page.locator(selector)
    await expect(element).toContainText(expectedText)
  }

  /**
   * Retry an async function until it succeeds or times out
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number
      delayMs?: number
      onRetry?: (attempt: number, error: Error) => void
    } = {}
  ): Promise<T> {
    const { maxAttempts = 3, delayMs = 1000, onRetry } = options

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error
        }
        if (onRetry) {
          onRetry(attempt, error as Error)
        }
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    throw new Error('Retry failed: this should never happen')
  }
}
