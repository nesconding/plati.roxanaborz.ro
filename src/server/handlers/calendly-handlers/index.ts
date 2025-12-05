import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { type Database, database } from '~/server/database/drizzle'
import {
  calendly_scheduled_events,
  calendly_webhooks
} from '~/server/database/schema/calendly'
import { CalendlyService } from '~/server/services/calendly'
import type { CalendlyScheduledEventsStatusType } from '~/shared/enums/calendly-scheduled-events-status-type'
import { CalendlyWebhookEventsType } from '~/shared/enums/calendly-webhook-events-type'

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

type CalendlyWebhookEvent = {
  event: string
  payload: {
    cancel_url?: string
    cancellation?: {
      canceled_by: string
      reason?: string
    }
    created_at?: string
    email?: string
    event?: string
    invitee?: {
      email: string
      name: string
      uri: string
    }
    name?: string
    new_invitee?: {
      email: string
      name: string
      uri: string
    }
    old_invitee?: {
      email: string
      name: string
      uri: string
    }
    questions_and_answers?: Array<{
      answer: string
      question: string
    }>
    reschedule_url?: string
    scheduled_event?: {
      uri: string
      name: string
      start_time: string
      end_time: string
      event_memberships: Array<{
        user: string
        user_email: string
        user_name: string
      }>
    }
    status?: 'active' | 'canceled'
    timezone?: string
    tracking?: {
      utm_campaign?: string
      utm_content?: string
      utm_medium?: string
      utm_source?: string
      utm_term?: string
    }
    uri?: string
  }
}

/**
 * Calendly Webhook Handlers
 * Handles webhook signature verification and event processing
 */
class CalendlyHandlersImpl {
  constructor(private readonly db: Database) {}

  /**
   * Verify Calendly webhook signature
   * Returns the signing key if verification succeeds, throws error otherwise
   */
  async verifyWebhookSignature(
    body: string,
    signatureHeader: string
  ): Promise<{ signingKey: string; webhookUri: string }> {
    // Step 1: Parse signature components
    // Format: "t=1492774577,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd"
    const signatureParts = signatureHeader.split(',').reduce(
      (acc, part) => {
        const [key, value] = part.split('=')
        if (key === 't') acc.timestamp = value
        if (key === 'v1') acc.signature = value
        return acc
      },
      { signature: '', timestamp: '' }
    )

    if (!signatureParts.timestamp || !signatureParts.signature) {
      throw new Error('Invalid signature format')
    }

    // Step 2: Verify timestamp to prevent replay attacks (3-minute tolerance)
    const threeMinutes = 180000 // 3 minutes in milliseconds
    const timestampMilliseconds = Number(signatureParts.timestamp) * 1000

    if (timestampMilliseconds < Date.now() - threeMinutes) {
      throw new Error('Signature timestamp is outside tolerance zone')
    }

    // Step 3: Get signing key from database
    const webhooks = await this.db.select().from(calendly_webhooks)

    if (webhooks.length === 0) {
      throw new Error('No webhook configuration found')
    }

    // Step 4: Verify signature with each webhook's signing key
    for (const webhook of webhooks) {
      // Construct signed payload: timestamp + '.' + body
      const signedPayload = `${signatureParts.timestamp}.${body}`

      // Compute expected signature using HMAC SHA256
      const expectedSignature = crypto
        .createHmac('sha256', webhook.signing_key)
        .update(signedPayload, 'utf8')
        .digest('hex')

      // Compare signatures
      if (expectedSignature === signatureParts.signature) {
        return {
          signingKey: webhook.signing_key,
          webhookUri: webhook.uri
        }
      }
    }

    throw new Error('Invalid signature')
  }

  /**
   * Handle invitee.created event
   */
  private async handleInviteeCreated(payload: unknown): Promise<void> {
    const data = payload as CalendlyWebhookEvent['payload']

    console.log('[Calendly Webhook] New invitee created:')
    console.log('  - Name:', data.name)
    console.log('  - Email:', data.email)
    console.log('  - Event URI:', data.scheduled_event?.uri)
    console.log('  - Status:', data.status)

    if (!data.scheduled_event || !data.email || !data.name || !data.uri) {
      console.error('[Calendly Webhook] Missing required fields in payload')
      return
    }

    const scheduledEvent = data.scheduled_event
    const closer = scheduledEvent.event_memberships?.[0]

    if (!closer) {
      console.error('[Calendly Webhook] Missing event_memberships in payload')
      return
    }

    // Extract phone number from questions_and_answers
    const phoneQuestion = data.questions_and_answers?.find(
      (qa) =>
        qa.question.toLowerCase() === 'număr de telefon' ||
        qa.question.toLowerCase() === 'numar de telefon' ||
        qa.question.toLowerCase() === 'numărul de telefon' ||
        qa.question.toLowerCase() === 'numarul de telefon'
    )
    const phoneNumber = phoneQuestion?.answer || null

    if (data.questions_and_answers) {
      console.log('  - Q&A:', data.questions_and_answers)
      console.log('  - Phone Number:', phoneNumber)
    }

    try {
      // Insert into database
      await this.db.insert(calendly_scheduled_events).values({
        closerEmail: closer.user_email,
        closerName: closer.user_name,
        endTime: scheduledEvent.end_time,
        inviteeEmail: data.email,
        inviteeName: data.name,
        inviteePhoneNumber: phoneNumber,
        inviteeUri: data.uri,
        name: scheduledEvent.name,
        startTime: scheduledEvent.start_time,
        status: data.status as CalendlyScheduledEventsStatusType,
        uri: scheduledEvent.uri
      })

      console.log(
        `[Calendly Webhook] Successfully inserted event: ${scheduledEvent.uri}`
      )
    } catch (error) {
      console.error('[Calendly Webhook] Failed to insert event:', error)
      throw error
    }
  }

  /**
   * Handle invitee.canceled event
   */
  private async handleInviteeCanceled(payload: unknown): Promise<void> {
    const data = payload as CalendlyWebhookEvent['payload']

    console.log('[Calendly Webhook] Invitee canceled:')
    console.log('  - Name:', data.name)
    console.log('  - Email:', data.email)
    console.log('  - Event URI:', data.scheduled_event?.uri)
    console.log('  - Cancellation reason:', data.cancellation?.reason)
    console.log('  - Canceled by:', data.cancellation?.canceled_by)

    const eventUri = data.scheduled_event?.uri

    if (!eventUri) {
      console.error('[Calendly Webhook] Missing scheduled_event.uri in payload')
      return
    }

    try {
      // Delete from database
      const result = await this.db
        .update(calendly_scheduled_events)
        .set({
          status: data.status as CalendlyScheduledEventsStatusType
        })
        .where(eq(calendly_scheduled_events.uri, eventUri))

      console.log(
        `[Calendly Webhook] Successfully updated event: ${eventUri} (rows affected: ${result.rowCount ?? 0})`
      )
    } catch (error) {
      console.error('[Calendly Webhook] Failed to delete event:', error)
      throw error
    }
  }

  /**
   * Route webhook event to appropriate handler
   */
  async handleWebhookEvent(event: string, payload: unknown): Promise<void> {
    console.log('[Calendly Webhook] Event received:', event)

    switch (event) {
      case CalendlyWebhookEventsType.InviteeCreated:
        await this.handleInviteeCreated(payload)
        break

      case CalendlyWebhookEventsType.InviteeCanceled:
        await this.handleInviteeCanceled(payload)
        break

      default:
        console.log('[Calendly Webhook] Unhandled event type:', event)
    }
  }

  /**
   * Sync all Calendly scheduled events with invitees to database
   * Clears existing events and fetches fresh data from Calendly
   * This is used during initial setup to populate the database
   */
  async syncScheduledEventsWithInvitees(): Promise<{ syncedCount: number }> {
    try {
      console.log(
        '[CalendlyHandlers] Starting scheduled events sync with invitees'
      )

      // Step 1: Clear existing events from database
      const deletedEventsCount = await this.db.delete(calendly_scheduled_events)
      console.log(
        `[CalendlyHandlers] Deleted ${deletedEventsCount.rowCount ?? 0} events from database`
      )

      // Step 2: Fetch all existing events from Calendly and insert into database
      console.log('[CalendlyHandlers] Fetching existing events from Calendly')
      const existingEvents = await CalendlyService.getAllEventsWithInvitees()

      console.log(
        `[CalendlyHandlers] Found ${existingEvents.length} existing events`
      )

      if (existingEvents.length > 0) {
        const BATCH_SIZE = 100 // Safe batch size for 13 columns (1300 params per batch)
        const chunks = chunkArray(existingEvents, BATCH_SIZE)

        await this.db.transaction(async (tx) => {
          for (const chunk of chunks) {
            await tx.insert(calendly_scheduled_events).values(chunk)
          }
        })
        console.log(
          `[CalendlyHandlers] Inserted ${existingEvents.length} events in ${chunks.length} batches`
        )
      }

      console.log(
        `[CalendlyHandlers] Sync completed: ${existingEvents.length} events synced`
      )

      return { syncedCount: existingEvents.length }
    } catch (cause) {
      throw new Error(
        'CalendlyHandlers syncScheduledEventsWithInvitees error',
        { cause }
      )
    }
  }

  /**
   * Setup Calendly webhook subscription
   * Deletes all existing webhooks and creates a fresh one
   * This is idempotent - calling it multiple times will always result in exactly one webhook
   */
  async setupWebhook(callbackUrl: string): Promise<{
    events: string[]
    uri: string
    url: string
  }> {
    try {
      console.log('[CalendlyHandlers] Starting webhook setup')

      // Step 1: Generate signing key for webhook verification
      const signingKey = crypto.randomBytes(32).toString('hex')
      console.log('[CalendlyHandlers] Generated signing key')
      console.log('[CalendlyHandlers] Callback URL:', callbackUrl)

      // Step 2: Get current user and organization
      const user = await CalendlyService.getUser()
      const organizationUri = user.resource.current_organization
      console.log('[CalendlyHandlers] Organization URI:', organizationUri)

      // Step 3: Delete all existing webhooks
      console.log(
        '[CalendlyHandlers] Fetching all existing webhooks from Calendly'
      )
      const calendlyWebhooks =
        await CalendlyService.listWebhookSubscriptions(organizationUri)

      if (calendlyWebhooks.length > 0) {
        console.log(
          `[CalendlyHandlers] Found ${calendlyWebhooks.length} existing webhooks - deleting all`
        )

        // Delete from Calendly in parallel
        await Promise.all(
          calendlyWebhooks.map(async (webhook) => {
            console.log(
              `[CalendlyHandlers] Deleting webhook from Calendly: ${webhook.uri}`
            )
            await CalendlyService.deleteWebhookSubscription(webhook.uri)
          })
        )

        console.log('[CalendlyHandlers] All webhooks deleted from Calendly')
      } else {
        console.log('[CalendlyHandlers] No existing webhooks found in Calendly')
      }

      // Delete all webhooks from database
      const deletedCount = await this.db.delete(calendly_webhooks)
      console.log(
        `[CalendlyHandlers] Deleted ${deletedCount.rowCount ?? 0} webhooks from database`
      )

      // Step 4: Create new webhook subscription
      console.log('[CalendlyHandlers] Creating new webhook subscription')
      const events = [
        CalendlyWebhookEventsType.InviteeCreated,
        CalendlyWebhookEventsType.InviteeCanceled
      ]

      const webhook = await CalendlyService.createWebhookSubscription({
        events,
        organization: organizationUri,
        scope: 'organization',
        signing_key: signingKey,
        url: callbackUrl
      })

      console.log(
        '[CalendlyHandlers] Webhook created in Calendly:',
        webhook.uri
      )

      // Step 5: Store webhook in database
      await this.db.insert(calendly_webhooks).values({
        createdAt: webhook.created_at,
        events: webhook.events as CalendlyWebhookEventsType[],
        signing_key: signingKey,
        updatedAt: webhook.updated_at,
        uri: webhook.uri,
        url: webhook.callback_url
      })

      console.log('[CalendlyHandlers] Webhook stored in database')

      return {
        events: webhook.events,
        uri: webhook.uri,
        url: webhook.callback_url
      }
    } catch (cause) {
      throw new Error('CalendlyHandlers setupWebhook error', { cause })
    }
  }

  /**
   * Sync Calendly scheduled events with database
   * Updates startTime, endTime, closerName, closerEmail for events that have changed
   * Deletes events that no longer exist in Calendly
   * Inserts new events from Calendly that don't exist in database
   */
  async syncScheduledEvents(): Promise<{
    checkedCount: number
    updatedCount: number
    deletedCount: number
    insertedCount: number
    errors: Array<{ uri: string; error: string }>
  }> {
    try {
      console.log('[CalendlyHandlers] Starting scheduled events sync')

      // Step 1: Fetch all events from Calendly
      console.log('[CalendlyHandlers] Fetching events from Calendly')
      const calendlyEvents = await CalendlyService.getEvents()
      console.log(
        `[CalendlyHandlers] Fetched ${calendlyEvents.length} events from Calendly`
      )

      // Step 2: Fetch all events from database
      console.log('[CalendlyHandlers] Fetching events from database')
      const dbEvents = await this.db.select().from(calendly_scheduled_events)
      console.log(
        `[CalendlyHandlers] Fetched ${dbEvents.length} events from database`
      )

      // Step 3: Create map for efficient lookup
      const calendlyEventsMap = new Map(
        calendlyEvents.map((event) => [event.uri, event])
      )

      let checkedCount = 0
      let updatedCount = 0
      let deletedCount = 0
      let insertedCount = 0
      const errors: Array<{ uri: string; error: string }> = []

      // Step 4: Process updates - only update if fields have changed
      console.log('[CalendlyHandlers] Checking for updates')
      for (const dbEvent of dbEvents) {
        const calendlyEvent = calendlyEventsMap.get(dbEvent.uri)

        if (!calendlyEvent) {
          // Event exists in DB but not in Calendly - will be deleted in next step
          continue
        }

        checkedCount++

        // Check if any field has changed
        const hasChanged =
          new Date(dbEvent.startTime).getTime() !==
            new Date(calendlyEvent.startTime).getTime() ||
          new Date(dbEvent.endTime).getTime() !==
            new Date(calendlyEvent.endTime).getTime() ||
          dbEvent.closerName !== calendlyEvent.closerName ||
          dbEvent.closerEmail !== calendlyEvent.closerEmail

        if (hasChanged) {
          try {
            await this.db
              .update(calendly_scheduled_events)
              .set({
                closerEmail: calendlyEvent.closerEmail,
                closerName: calendlyEvent.closerName,
                endTime: new Date(calendlyEvent.endTime).toISOString(),
                startTime: new Date(calendlyEvent.startTime).toISOString()
              })
              .where(eq(calendly_scheduled_events.uri, dbEvent.uri))

            updatedCount++
            console.log(`[CalendlyHandlers] Updated event: ${dbEvent.uri}`)
          } catch (error) {
            errors.push({
              error: error instanceof Error ? error.message : 'Unknown error',
              uri: dbEvent.uri
            })
            console.error(
              `[CalendlyHandlers] Failed to update event ${dbEvent.uri}:`,
              error
            )
          }
        }
      }

      // Step 5: Delete events that exist in DB but not in Calendly
      console.log('[CalendlyHandlers] Checking for deletions')
      for (const dbEvent of dbEvents) {
        if (!calendlyEventsMap.has(dbEvent.uri)) {
          try {
            await this.db
              .delete(calendly_scheduled_events)
              .where(eq(calendly_scheduled_events.uri, dbEvent.uri))

            deletedCount++
            console.log(`[CalendlyHandlers] Deleted event: ${dbEvent.uri}`)
          } catch (error) {
            errors.push({
              error: error instanceof Error ? error.message : 'Unknown error',
              uri: dbEvent.uri
            })
            console.error(
              `[CalendlyHandlers] Failed to delete event ${dbEvent.uri}:`,
              error
            )
          }
        }
      }

      // Step 6: Insert new events that exist in Calendly but not in DB
      console.log('[CalendlyHandlers] Checking for new events to insert')
      const dbEventsMap = new Map(dbEvents.map((event) => [event.uri, event]))

      for (const calendlyEvent of calendlyEvents) {
        if (!dbEventsMap.has(calendlyEvent.uri)) {
          try {
            // Fetch invitee data for this event
            const invitee = await CalendlyService.getEventInvitees(
              calendlyEvent.uri
            )

            if (!invitee) {
              console.warn(
                `[CalendlyHandlers] No invitee found for event: ${calendlyEvent.uri}`
              )
              continue
            }

            // Extract phone number from questions_and_answers
            const phoneQuestion = invitee.questions_and_answers?.find(
              (qa) =>
                qa.question.toLowerCase() === 'număr de telefon' ||
                qa.question.toLowerCase() === 'numar de telefon' ||
                qa.question.toLowerCase() === 'numărul de telefon' ||
                qa.question.toLowerCase() === 'numarul de telefon'
            )

            // Insert new event
            await this.db.insert(calendly_scheduled_events).values({
              closerEmail: calendlyEvent.closerEmail,
              closerName: calendlyEvent.closerName,
              endTime: calendlyEvent.endTime,
              inviteeEmail: invitee.email,
              inviteeName: invitee.name,
              inviteePhoneNumber: phoneQuestion?.answer || null,
              inviteeUri: invitee.uri,
              name: calendlyEvent.name,
              startTime: calendlyEvent.startTime,
              status: 'active' as CalendlyScheduledEventsStatusType,
              uri: calendlyEvent.uri
            })

            insertedCount++
            console.log(
              `[CalendlyHandlers] Inserted new event: ${calendlyEvent.uri}`
            )
          } catch (error) {
            errors.push({
              error: error instanceof Error ? error.message : 'Unknown error',
              uri: calendlyEvent.uri
            })
            console.error(
              `[CalendlyHandlers] Failed to insert event ${calendlyEvent.uri}:`,
              error
            )
          }
        }
      }

      console.log('[CalendlyHandlers] Sync completed successfully')
      console.log(`[CalendlyHandlers] - Checked: ${checkedCount}`)
      console.log(`[CalendlyHandlers] - Updated: ${updatedCount}`)
      console.log(`[CalendlyHandlers] - Deleted: ${deletedCount}`)
      console.log(`[CalendlyHandlers] - Inserted: ${insertedCount}`)
      console.log(`[CalendlyHandlers] - Errors: ${errors.length}`)

      return {
        checkedCount,
        deletedCount,
        errors,
        insertedCount,
        updatedCount
      }
    } catch (cause) {
      throw new Error('CalendlyHandlers syncScheduledEvents error', { cause })
    }
  }
}

export const CalendlyHandlers = new CalendlyHandlersImpl(database)
