import { CalendlyHandlers } from '~/server/handlers/calendly-handlers'

const BASE_URL = process.env.BASE_URL || 'plati.roxanaborz.ro'

async function main() {
  try {
    console.log('[Calendly Setup] Starting Calendly webhook setup')
    // Setup webhook via CalendlyHandlers
    const webhook = await CalendlyHandlers.setupWebhook(
      `${BASE_URL}/api/webhooks/calendly`
    )
    console.log(
      '[Calendly Setup] Calendly webhook setup completed successfully',
      '\n',
      webhook
    )

    console.log('[Calendly Setup] Starting sync scheduled events with invitees')
    const result = await CalendlyHandlers.syncScheduledEventsWithInvitees()
    console.log(
      '[Calendly Setup] Sync scheduled events with invitees completed successfully',
      result
    )
    process.exit(0)
  } catch (error) {
    console.error('[Calendly Setup] Error setting up calendly:', error)
    process.exit(1)
  }
}

main()
