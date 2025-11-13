import Stripe from 'stripe'
import { APIRequestContext } from '@playwright/test'

/**
 * E2E Stripe Helpers
 * Functions to simulate Stripe webhooks and payment flows
 */

export class E2EStripe {
  /**
   * Send a simulated Stripe webhook event to the API
   *
   * @param request - Playwright API request context
   * @param event - The Stripe event to send
   * @param options - Optional configuration
   */
  static async sendWebhook(
    request: APIRequestContext,
    event: Partial<Stripe.Event>,
    options?: {
      signature?: string
      skipSignature?: boolean
    }
  ) {
    const baseURL = process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || '9099'}`

    const response = await request.post(`${baseURL}/api/webhooks/stripe`, {
      data: event,
      headers: {
        'Content-Type': 'application/json',
        // In e2e tests, we'll need to mock signature verification
        // or use a test webhook secret
        ...(options?.signature && {
          'stripe-signature': options.signature
        })
      }
    })

    return response
  }

  /**
   * Create a mock PaymentIntent succeeded event
   */
  static createPaymentIntentSucceededEvent(
    paymentIntentId: string,
    metadata: Record<string, string>
  ): Partial<Stripe.Event> {
    return {
      id: `evt_test_${Date.now()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          status: 'succeeded',
          amount: 50000,
          currency: 'ron',
          metadata,
          created: Math.floor(Date.now() / 1000),
          payment_method: 'pm_test_123',
          client_secret: `${paymentIntentId}_secret_test`
        } as Stripe.PaymentIntent
      },
      created: Math.floor(Date.now() / 1000),
      livemode: false
    }
  }

  /**
   * Create a mock PaymentIntent failed event
   */
  static createPaymentIntentFailedEvent(
    paymentIntentId: string,
    metadata: Record<string, string>
  ): Partial<Stripe.Event> {
    return {
      id: `evt_test_${Date.now()}`,
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          status: 'requires_payment_method',
          amount: 50000,
          currency: 'ron',
          metadata,
          created: Math.floor(Date.now() / 1000),
          last_payment_error: {
            type: 'card_error',
            code: 'card_declined',
            message: 'Your card was declined'
          }
        } as Stripe.PaymentIntent
      },
      created: Math.floor(Date.now() / 1000),
      livemode: false
    }
  }

  /**
   * Create a mock PaymentIntent canceled event
   */
  static createPaymentIntentCanceledEvent(
    paymentIntentId: string,
    metadata: Record<string, string>
  ): Partial<Stripe.Event> {
    return {
      id: `evt_test_${Date.now()}`,
      type: 'payment_intent.canceled',
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          status: 'canceled',
          amount: 50000,
          currency: 'ron',
          metadata,
          created: Math.floor(Date.now() / 1000),
          cancellation_reason: 'abandoned'
        } as Stripe.PaymentIntent
      },
      created: Math.floor(Date.now() / 1000),
      livemode: false
    }
  }

  /**
   * Wait for webhook processing to complete
   * Useful when you need to verify database changes after webhook
   */
  static async waitForWebhookProcessing(ms: number = 1000) {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Generate Stripe test card numbers
   */
  static getTestCards() {
    return {
      success: '4242424242424242',
      declined: '4000000000000002',
      requiresAuth: '4000002500003155',
      insufficientFunds: '4000000000009995'
    }
  }
}
