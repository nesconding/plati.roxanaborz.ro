import { type NextRequest, NextResponse } from 'next/server'
import { StripeHandlers } from '~/server/handlers/stripe-handlers'

export const dynamic = 'force-dynamic' // Force dynamic (server) route instead of static page

/**
 * Cron job endpoint to cancel expired payment links
 *
 * This endpoint should be called hourly to process:
 * - Product payment links that have expired
 * - Extension payment links that have expired
 *
 * For each expired payment link:
 * - Cancels the Stripe payment intent
 * - Updates the payment link status to Expired
 *
 * Security:
 * - Requires CRON_SECRET in Authorization header
 * - Set CRON_SECRET in .env: CRON_SECRET=your-secret-key
 *
 * Setup Options:
 *
 * 1. Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cancel-expired-payments",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 *
 * 2. System Cron (hourly):
 * 0 * * * * curl -X GET https://plati.rb.ro/api/cron/cancel-expired-payments \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 *
 * 3. External Service (e.g., cron-job.org, EasyCron):
 * URL: https://plati.rb.ro/api/cron/cancel-expired-payments
 * Method: GET
 * Header: Authorization: Bearer YOUR_CRON_SECRET
 * Schedule: 0 * * * * (every hour)
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Validate authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured in environment variables')
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      )
    }

    // Check Bearer token format
    const expectedAuth = `Bearer ${cronSecret}`
    if (authHeader !== expectedAuth) {
      console.warn('Unauthorized cron job attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 2: Execute use case
    console.log('[Cron] Starting expired payment cancellation...')
    const startTime = Date.now()

    const result = await StripeHandlers.handleCancelExpiredPayments()

    const duration = Date.now() - startTime
    console.log(
      `[Cron] Completed expired payment cancellation in ${duration}ms`
    )
    console.log(`[Cron] Processed ${result.processedCount} payment links`)
    console.log(
      `[Cron] Successfully cancelled ${result.successCount} payment links`
    )
    if (result.errors.length > 0) {
      console.log(
        `[Cron] Failed to cancel ${result.errors.length} payment links`
      )
    }

    // Step 3: Return result
    return NextResponse.json(
      {
        duration: `${duration}ms`,
        errors: result.errors,
        processedCount: result.processedCount,
        successCount: result.successCount,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Cron] Failed to cancel expired payments:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
