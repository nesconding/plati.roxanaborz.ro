import { Page } from '@playwright/test'

/**
 * E2E Authentication Helpers
 * Functions to handle user authentication in e2e tests
 */

export class E2EAuth {
  /**
   * Log in as a test user
   * This assumes you have a login page at /login
   *
   * @param page - Playwright page object
   * @param credentials - User credentials
   */
  static async login(
    page: Page,
    credentials: { email: string; password: string }
  ) {
    await page.goto('/login')
    await page.fill('input[name="email"]', credentials.email)
    await page.fill('input[name="password"]', credentials.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  }

  /**
   * Log out the current user
   */
  static async logout(page: Page) {
    // Adjust this based on your logout flow
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL('**/login')
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    try {
      // Check for presence of authenticated user elements
      const userMenu = await page.locator('[data-testid="user-menu"]').count()
      return userMenu > 0
    } catch {
      return false
    }
  }

  /**
   * Get the current user's session from localStorage or cookies
   */
  static async getSession(page: Page) {
    return await page.evaluate(() => {
      // Adjust based on how your app stores sessions
      return localStorage.getItem('session')
    })
  }
}
