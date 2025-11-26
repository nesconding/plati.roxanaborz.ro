import { timingSafeEqual } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { database } from '~/server/database/drizzle'
import { SubscriptionMembershipSyncService } from '~/server/services/subscription-membership-sync'

export const dynamic = 'force-dynamic' // Force dynamic (server) route instead of static page

/**
 * Cron job to process scheduled cancellations
 *
 * This endpoint should be called daily (recommended: 6:00 AM UTC) to process
 * subscriptions that have reached their scheduled cancellation date.
 *
 * When a subscription is cancelled gracefully, the scheduledCancellationDate is set
 * to the next payment date. This cron job checks for subscriptions where that date
 * has been reached and cancels both the subscription and associated membership.
 *
 * @example
 * // In vercel.json or cron service:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-scheduled-cancellations",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authorization
    const cronSecret = process.env.CRON_SECRET

    // Fail fast if CRON_SECRET is not configured
    if (!cronSecret) {
      console.error(
        '[Cron] CRON_SECRET not configured in environment variables'
      )
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      )
    }

    const authHeader = req.headers.get('authorization')
    const expectedAuth = `Bearer ${cronSecret}`

    // Use constant-time comparison to mitigate timing attacks
    if (!authHeader || authHeader.length !== expectedAuth.length) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Convert to buffers for constant-time comparison
    const authHeaderBuffer = Buffer.from(authHeader, 'utf8')
    const expectedAuthBuffer = Buffer.from(expectedAuth, 'utf8')

    if (!timingSafeEqual(authHeaderBuffer, expectedAuthBuffer)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const subscriptionMembershipSyncService =
      new SubscriptionMembershipSyncService(database)

    // Process scheduled cancellations
    const result =
      await subscriptionMembershipSyncService.processScheduledCancellations()

    console.log(
      `[Cron] Processed ${result.processedCount} scheduled cancellations`
    )

    if (result.cancelledSubscriptions.length > 0) {
      console.log(
        `[Cron] Cancelled subscriptions: ${result.cancelledSubscriptions.join(', ')}`
      )
    }

    return NextResponse.json({
      cancelledSubscriptions: result.cancelledSubscriptions,
      message: `Processed ${result.processedCount} scheduled cancellations`,
      processedCount: result.processedCount,
      success: true
    })
  } catch (error) {
    console.error('[Cron] Error processing scheduled cancellations:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process scheduled cancellations',
        success: false
      },
      { status: 500 }
    )
  }
}
