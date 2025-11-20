import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { CalendlyHandlers } from '~/server/handlers/calendly-handlers'

/**
 * Calendly Webhook Handler
 *
 * Handles Calendly webhook events for the organization.
 *
 * Handled Events:
 * - invitee.created: New invitee scheduled
 * - invitee.canceled: Invitee canceled
 *
 * Security:
 * - Webhook signature verification using HMAC SHA256
 * - Replay attack prevention with timestamp validation (3-minute tolerance)
 * - Signing keys stored securely in database
 */
export async function POST(req: Request) {
  try {
    // Step 1: Get raw body and signature header
    const body = await req.text()
    const signature = (await headers()).get('Calendly-Webhook-Signature')

    if (!signature) {
      console.error('[Calendly Webhook] Missing signature header')
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Step 2: Verify webhook signature
    try {
      const { webhookUri } = await CalendlyHandlers.verifyWebhookSignature(
        body,
        signature
      )
      console.log('[Calendly Webhook] Signature verified successfully')
      console.log('[Calendly Webhook] Matched webhook URI:', webhookUri)
    } catch (error) {
      console.error(
        '[Calendly Webhook] Signature verification failed:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      return NextResponse.json(
        {
          error: `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        { status: 400 }
      )
    }

    // Step 3: Parse webhook payload
    let event: {
      event: string
      payload: unknown
    }

    try {
      event = JSON.parse(body)
    } catch (error) {
      console.error('[Calendly Webhook] Failed to parse webhook body:', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Step 4: Route event to appropriate handler
    await CalendlyHandlers.handleWebhookEvent(event.event, event.payload)

    // Step 5: Return success response
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[Calendly Webhook] Error processing webhook:', error)

    // Return 500 to tell Calendly to retry
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
    { error: 'Method not allowed. Calendly webhooks must use POST.' },
    { status: 405 }
  )
}
