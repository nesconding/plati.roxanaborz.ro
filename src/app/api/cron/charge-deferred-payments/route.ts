import { type NextRequest, NextResponse } from 'next/server'
import { StripeHandlers } from '~/server/handlers/stripe-handlers'

export const dynamic = 'force-dynamic' // Force dynamic (server) route instead of static page

/**
 * Cron job endpoint to charge deferred payments
 *
 * This endpoint should be called daily (recommended: 6:00 AM UTC) to process:
 * - Product Deposit: Final payment after deposit
 * - Extension Deposit: Final payment after deposit
 * - Product Installments: Monthly installment payments
 * - Product Installments Deposit: Monthly installment payments (after deposit)
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
 *     "path": "/api/cron/charge-deferred-payments",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 *
 * 2. System Cron:
 * 0 6 * * * curl -X GET https://plati.rb.ro/api/cron/charge-deferred-payments \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 *
 * 3. External Service (e.g., cron-job.org, EasyCron):
 * URL: https://plati.rb.ro/api/cron/charge-deferred-payments
 * Method: GET
 * Header: Authorization: Bearer YOUR_CRON_SECRET
 * Schedule: 0 6 * * * (daily at 6 AM UTC)
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
    console.log('[Cron] Starting deferred payment charging...')
    const startTime = Date.now()

    const result = await StripeHandlers.handleChargeDeferredPayments()

    const duration = Date.now() - startTime
    console.log(`[Cron] Completed deferred payment charging in ${duration}ms`)
    console.log(`[Cron] Processed ${result.processedCount} payments`)
    console.log(`[Cron] Successfully processed ${result.successCount} payments`)

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
    console.error('[Cron] Failed to charge deferred payments:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
