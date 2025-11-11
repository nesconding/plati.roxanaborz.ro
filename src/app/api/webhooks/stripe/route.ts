import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { StripeHandlers } from '~/server/handlers/stripe-handlers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for payment processing.
 *
 * Handled Events:
 * - payment_intent.succeeded: Initial payment completed (Integral, Deposit, Installments, InstallmentsDeposit)
 *
 * Note: Recurring payments (Deposit final payment, Installments) are handled via cron jobs,
 * not Stripe Subscriptions/Invoices.
 *
 * Security:
 * - Webhook signature verification ensures requests come from Stripe
 * - Set STRIPE_WEBHOOK_SECRET in environment variables
 */
export async function POST(req: Request) {
  try {
    // Step 1: Get raw body and signature
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      console.error('[Webhook] Missing Stripe signature')
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Step 2: Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error(
        '[Webhook] Signature verification failed:',
        err instanceof Error ? err.message : 'Unknown error'
      )
      return NextResponse.json(
        {
          error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        },
        { status: 400 }
      )
    }

    console.log(`[Webhook] Received event: ${event.type}`)

    // Step 3: Route event to appropriate handler
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Handle successful payment - creates orders, memberships, subscriptions
        await StripeHandlers.paymentIntentSucceeded(paymentIntent)

        console.log(
          `[Webhook] Successfully processed payment_intent.succeeded for ${paymentIntent.id}`
        )
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    // Step 4: Return success response
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    // Step 5: Handle errors
    console.error('[Webhook] Error processing webhook:', error)

    // Return 500 to tell Stripe to retry
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Prevent other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Stripe webhooks must use POST.' },
    { status: 405 }
  )
}
