import { type NextRequest, NextResponse } from 'next/server'
import { CalendlyHandlers } from '~/server/handlers/calendly-handlers'

/**
 * Cron Job: Sync Calendly Scheduled Events
 *
 * This endpoint synchronizes Calendly scheduled events with the database by:
 * - Updating startTime, endTime, closerName, closerEmail for events that have changed
 * - Deleting events that no longer exist in Calendly
 *
 * Schedule: Every minute
 *
 * Security:
 * - Requires CRON_SECRET in Authorization header
 * - Set CRON_SECRET in .env: CRON_SECRET=your-secret-key
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Validate authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured in environment variables')
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      )
    }

    // Check Bearer token format
    const expectedAuth = `Bearer ${cronSecret}`
    if (authHeader !== expectedAuth) {
      console.warn('[Cron] Unauthorized cron job attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 2: Execute sync
    console.log('[Cron] Starting Calendly events sync...')
    const startTime = Date.now()

    const result = await CalendlyHandlers.syncScheduledEvents()

    const duration = Date.now() - startTime
    console.log(`[Cron] Completed Calendly events sync in ${duration}ms`)
    console.log(`[Cron] Checked ${result.checkedCount} events`)
    console.log(`[Cron] Updated ${result.updatedCount} events`)
    console.log(`[Cron] Deleted ${result.deletedCount} events`)

    if (result.errors.length > 0) {
      console.warn(`[Cron] Encountered ${result.errors.length} errors:`, result.errors)
    }

    // Step 3: Return result
    return NextResponse.json(
      {
        checkedCount: result.checkedCount,
        deletedCount: result.deletedCount,
        duration: `${duration}ms`,
        errors: result.errors,
        timestamp: new Date().toISOString(),
        updatedCount: result.updatedCount
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Cron] Failed to sync Calendly events:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Prevent GET requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
