import cliProgress from 'cli-progress'
import { z } from 'zod'
import type { CalendlyScheduledEventsStatusType } from '~/shared/enums/calendly-scheduled-events-status-type'

const GetUserResponseSchema = z.looseObject({
  resource: z.looseObject({
    current_organization: z.string(),
    email: z.string()
  })
})

const GetEventsResponseSchema = z.looseObject({
  collection: z.array(
    z.looseObject({
      created_at: z.string().optional(),
      end_time: z.string(),
      event_memberships: z.array(
        z.looseObject({
          user_email: z.string(),
          user_name: z.string()
        })
      ),
      name: z.string(),
      start_time: z.string(),
      updated_at: z.string().optional(),
      uri: z.string()
    })
  ),
  pagination: z.looseObject({
    next_page_token: z.string().nullable()
  })
})
type CalendlyGetEventsResponse = z.infer<typeof GetEventsResponseSchema>

const GetEventInviteesResponseSchema = z.looseObject({
  collection: z.array(
    z.looseObject({
      email: z.string(),
      name: z.string(),
      questions_and_answers: z.array(
        z.looseObject({
          answer: z.string(),
          question: z.string()
        })
      ),
      uri: z.string()
    })
  )
})
type CalendlyGetEventInviteesResponse = z.infer<
  typeof GetEventInviteesResponseSchema
>

const ListWebhookSubscriptionsResponseSchema = z.looseObject({
  collection: z.array(
    z.looseObject({
      callback_url: z.string(),
      created_at: z.string(),
      creator: z.string().nullable(),
      events: z.array(z.string()),
      organization: z.string(),
      retry_started_at: z.string().nullable(),
      scope: z.string(),
      state: z.enum(['active', 'disabled']),
      updated_at: z.string(),
      uri: z.string(),
      user: z.string().nullable()
    })
  ),
  pagination: z.looseObject({
    count: z.number(),
    next_page: z.string().nullable(),
    next_page_token: z.string().nullable(),
    previous_page: z.string().nullable(),
    previous_page_token: z.string().nullable()
  })
})
type CalendlyListWebhookSubscriptionsResponse = z.infer<
  typeof ListWebhookSubscriptionsResponseSchema
>

const CreateWebhookSubscriptionResponseSchema = z.looseObject({
  resource: z.looseObject({
    callback_url: z.string(),
    created_at: z.string(),
    creator: z.string().nullable(),
    events: z.array(z.string()),
    organization: z.string(),
    retry_started_at: z.string().nullable(),
    scope: z.string(),
    state: z.enum(['active', 'disabled']),
    updated_at: z.string(),
    uri: z.string(),
    user: z.string().nullable()
  })
})
type CalendlyCreateWebhookSubscriptionResponse = z.infer<
  typeof CreateWebhookSubscriptionResponseSchema
>

// Utility: Create logger with timestamps and step tracking
function createLogger(prefix: string) {
  const startTime = Date.now()
  let stepCounter = 0

  return {
    error: (message: string, error?: unknown) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
      console.error(`[${prefix}] [${elapsed}s] ERROR: ${message}`, error)
    },
    log: (message: string, data?: unknown) => {
      stepCounter++
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(
        `[${prefix}] [${elapsed}s] Step ${stepCounter}: ${message}`,
        data !== undefined ? data : ''
      )
    },
    success: (message: string, data?: unknown) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(
        `[${prefix}] [${elapsed}s] ✓ ${message}`,
        data !== undefined ? data : ''
      )
    }
  }
}

// Utility: Smart rate limiter for Calendly API (500 requests/minute)
function createRateLimiter(maxRequestsPerMinute = 500) {
  let requestCount = 0
  let windowStart = Date.now()

  return {
    getStats() {
      return {
        remaining: maxRequestsPerMinute - requestCount,
        requestCount,
        windowElapsed: Date.now() - windowStart
      }
    },
    incrementCount(): void {
      requestCount++
    },
    async waitIfNeeded(): Promise<void> {
      const now = Date.now()
      const windowElapsed = now - windowStart

      // Reset window if a minute has passed
      if (windowElapsed >= 60000) {
        requestCount = 0
        windowStart = now
        return
      }

      // If we're at the limit, wait until the window resets
      if (requestCount >= maxRequestsPerMinute) {
        const waitTime = 60000 - windowElapsed
        console.log(
          `[RateLimiter] Reached ${maxRequestsPerMinute} requests. Waiting ${(waitTime / 1000).toFixed(1)}s...`
        )
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        requestCount = 0
        windowStart = Date.now()
      }
    }
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

class CalendlyServiceImpl {
  /**
   * Centralized fetch function with logging and rate limiting
   * Automatically handles 429 (rate limit) and 500 (server error) responses with retry logic
   */
  private async fetchCalendly<T>(
    url: string,
    schema: z.ZodType<T>,
    logger: ReturnType<typeof createLogger> | null,
    rateLimiter: ReturnType<typeof createRateLimiter>,
    description: string,
    retryCount = 0
  ): Promise<T> {
    const maxRetries = 3

    await rateLimiter.waitIfNeeded()

    logger?.log(`Fetching ${description}`, { url })

    // Add timeout control for serverless environment
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
      logger?.log(`Fetch timeout for ${description} after 25 seconds`)
    }, 25000) // 25 second timeout

    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_TOKEN}`,
          Connection: 'close' // Prevent keep-alive in serverless
        },
        signal: controller.signal
      })
      clearTimeout(timeout)
    } catch (error) {
      clearTimeout(timeout)

      // Handle network errors (socket errors, timeouts, connection resets)
      const isNetworkError =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.includes('socket') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('fetch failed'))

      if (isNetworkError && retryCount < maxRetries) {
        const waitTime = Math.min(1000 * 2 ** retryCount, 10000) // Exponential backoff, max 10s
        logger?.log(
          `Network error for ${description}. Retry ${retryCount + 1}/${maxRetries} in ${waitTime / 1000}s...`,
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            errorName: error instanceof Error ? error.name : undefined
          }
        )
        await new Promise((resolve) => setTimeout(resolve, waitTime))

        logger?.log(`Retrying ${description} (attempt ${retryCount + 1})`)
        return this.fetchCalendly(
          url,
          schema,
          logger,
          rateLimiter,
          description,
          retryCount + 1
        )
      }

      // If not a network error or max retries exceeded, throw
      logger?.error(`Failed to fetch ${description}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }

    rateLimiter.incrementCount()

    // Handle 429 (Rate Limit Exceeded) - wait 1 minute and retry
    if (response.status === 429) {
      logger?.log(
        `Rate limit exceeded (429) for ${description}. Waiting 60 seconds before retry...`
      )
      await new Promise((resolve) => setTimeout(resolve, 60000)) // Wait 1 minute

      logger?.log(`Retrying ${description} after rate limit wait`)
      return this.fetchCalendly(
        url,
        schema,
        logger,
        rateLimiter,
        description,
        0
      )
    }

    // Handle 500 (Internal Server Error) - retry with exponential backoff
    if (response.status === 500 && retryCount < maxRetries) {
      const waitTime = Math.min(1000 * 2 ** retryCount, 10000) // Exponential backoff, max 10s
      logger?.log(
        `Internal server error (500) for ${description}. Retry ${retryCount + 1}/${maxRetries} in ${waitTime / 1000}s...`
      )
      await new Promise((resolve) => setTimeout(resolve, waitTime))

      logger?.log(`Retrying ${description} (attempt ${retryCount + 1})`)
      return this.fetchCalendly(
        url,
        schema,
        logger,
        rateLimiter,
        description,
        retryCount + 1
      )
    }

    // Handle other error responses
    if (!response.ok) {
      const errorText = await response.text()
      logger?.error(`Failed to fetch ${description}`, {
        error: errorText,
        status: response.status
      })
      throw new Error(`Failed to fetch ${description}: ${response.status}`)
    }

    const json = await response.json()
    const { success, data, error } = schema.safeParse(json)

    if (!success) {
      logger?.error(`Failed to parse ${description}`, error)
      throw new Error(`Failed to parse ${description}`, { cause: error })
    }

    logger?.log(`Successfully fetched ${description}`)
    return data
  }

  /**
   * Get invitee data for a specific event
   * Returns the first invitee or null if none found
   */
  async getEventInvitees(
    eventUri: string
  ): Promise<CalendlyGetEventInviteesResponse['collection'][number] | null> {
    const logger = createLogger('CalendlyService.getEventInvitees')
    const rateLimiter = createRateLimiter(490)

    try {
      const response = await this.fetchCalendly(
        `${eventUri}/invitees`,
        GetEventInviteesResponseSchema,
        logger,
        rateLimiter,
        'event invitees'
      )

      return response.collection[0] || null
    } catch (error) {
      logger.error(`Failed to fetch invitees for event ${eventUri}`, error)
      return null
    }
  }

  /**
   * Private helper method used by batchProcessEvents
   */
  private async getEventInviteesInternal(
    eventUri: string,
    logger: ReturnType<typeof createLogger> | null,
    rateLimiter: ReturnType<typeof createRateLimiter>
  ): Promise<CalendlyGetEventInviteesResponse['collection'][number] | null> {
    try {
      const response = await this.fetchCalendly(
        `${eventUri}/invitees`,
        GetEventInviteesResponseSchema,
        logger,
        rateLimiter,
        'event invitees'
      )

      return response.collection[0] || null
    } catch (error) {
      logger?.error(`Failed to fetch invitees for event ${eventUri}`, error)
      return null
    }
  }

  /**
   * Process events in parallel batches with rate limiting
   */
  private async batchProcessEvents(
    events: CalendlyGetEventsResponse['collection'],
    logger: ReturnType<typeof createLogger> | null,
    rateLimiter: ReturnType<typeof createRateLimiter>,
    progressBar: cliProgress.SingleBar | null,
    batchSize = 50
  ): Promise<
    {
      uri: string
      name: string
      closerEmail: string
      closerName: string
      startTime: string
      endTime: string
      inviteeEmail: string
      inviteeName: string
      status: CalendlyScheduledEventsStatusType
      inviteeUri: string
      inviteePhoneNumber: string | null
      createdAt?: string | undefined
      updatedAt?: string | undefined
    }[]
  > {
    const results: {
      uri: string
      name: string
      closerEmail: string
      closerName: string
      startTime: string
      endTime: string
      inviteeEmail: string
      inviteeName: string
      inviteeUri: string
      inviteePhoneNumber: string | null
      status: CalendlyScheduledEventsStatusType
      createdAt?: string | undefined
      updatedAt?: string | undefined
    }[] = []

    const chunks = chunkArray(events, batchSize)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      const chunkResults = await Promise.all(
        chunk.map(async (event) => {
          // Get invitee data
          const invitee = await this.getEventInviteesInternal(
            event.uri,
            logger,
            rateLimiter
          )

          if (!invitee) {
            logger?.error(`No invitee found for event ${event.uri}`)
            return null
          }

          // Extract phone number from questions_and_answers
          const phoneQuestion = invitee.questions_and_answers?.find(
            (qa) =>
              qa.question.toLowerCase() === 'număr de telefon' ||
              qa.question.toLowerCase() === 'numar de telefon' ||
              qa.question.toLowerCase() === 'numărul de telefon' ||
              qa.question.toLowerCase() === 'numarul de telefon'
          )

          return {
            closerEmail: event.event_memberships[0]?.user_email || '',
            closerName: event.event_memberships[0]?.user_name || '',
            createdAt: event.created_at,
            endTime: event.end_time,
            inviteeEmail: invitee.email,
            inviteeName: invitee.name,
            inviteePhoneNumber: phoneQuestion?.answer || null,
            inviteeUri: invitee.uri,
            name: event.name,
            startTime: event.start_time,
            status: event.status as CalendlyScheduledEventsStatusType,
            updatedAt: event.updated_at,
            uri: event.uri
          }
        })
      )

      // Filter out null results and add to results
      for (const result of chunkResults) {
        if (result !== null) {
          results.push(result)
        }
      }

      // Update progress bar
      if (progressBar) {
        progressBar.increment(chunk.length)
      }
    }

    return results
  }

  /**
   * Get current user information
   */
  async getUser() {
    const logger = createLogger('CalendlyService.getUser')
    const rateLimiter = createRateLimiter(490)

    const user = await this.fetchCalendly(
      'https://api.calendly.com/users/me',
      GetUserResponseSchema,
      logger,
      rateLimiter,
      'current user'
    )

    return user
  }

  /**
   * List all webhook subscriptions for the organization
   */
  async listWebhookSubscriptions(
    organizationUri: string,
    scope: 'organization' | 'user' = 'organization'
  ): Promise<CalendlyListWebhookSubscriptionsResponse['collection']> {
    const logger = createLogger('CalendlyService.listWebhookSubscriptions')
    const rateLimiter = createRateLimiter(490)

    const url = new URL('https://api.calendly.com/webhook_subscriptions')
    url.searchParams.set('organization', organizationUri)
    url.searchParams.set('scope', scope)

    const response = await this.fetchCalendly(
      url.toString(),
      ListWebhookSubscriptionsResponseSchema,
      logger,
      rateLimiter,
      'webhook subscriptions'
    )

    return response.collection
  }

  /**
   * Create a new webhook subscription
   */
  async createWebhookSubscription(params: {
    url: string
    events: string[]
    organization: string
    scope: 'organization' | 'user'
    signing_key: string
  }): Promise<CalendlyCreateWebhookSubscriptionResponse['resource']> {
    const logger = createLogger('CalendlyService.createWebhookSubscription')
    const rateLimiter = createRateLimiter(490)

    await rateLimiter.waitIfNeeded()

    logger.log('Creating webhook subscription', params)

    const response = await fetch(
      'https://api.calendly.com/webhook_subscriptions',
      {
        body: JSON.stringify(params),
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        method: 'POST'
      }
    )

    rateLimiter.incrementCount()

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Failed to create webhook subscription', {
        error: errorText,
        status: response.status
      })
      throw new Error(
        `Failed to create webhook subscription: ${response.status} - ${errorText}`
      )
    }

    const json = await response.json()
    const { success, data, error } =
      CreateWebhookSubscriptionResponseSchema.safeParse(json)

    if (!success) {
      logger.error('Failed to parse webhook subscription response', error)
      throw new Error('Failed to parse webhook subscription response', {
        cause: error
      })
    }

    logger.success('Webhook subscription created successfully', data.resource)
    return data.resource
  }

  /**
   * Delete a webhook subscription
   */
  async deleteWebhookSubscription(webhookUri: string): Promise<void> {
    const logger = createLogger('CalendlyService.deleteWebhookSubscription')
    const rateLimiter = createRateLimiter(490)

    await rateLimiter.waitIfNeeded()

    logger.log('Deleting webhook subscription', { webhookUri })

    const response = await fetch(webhookUri, {
      headers: {
        Authorization: `Bearer ${process.env.CALENDLY_TOKEN}`
      },
      method: 'DELETE'
    })

    rateLimiter.incrementCount()

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Failed to delete webhook subscription', {
        error: errorText,
        status: response.status
      })
      throw new Error(
        `Failed to delete webhook subscription: ${response.status} - ${errorText}`
      )
    }

    logger.success('Webhook subscription deleted successfully', { webhookUri })
  }

  /**
   * Fetch all Calendly scheduled events (without invitee details)
   * Returns basic event data for synchronization
   * Uses smart rate limiting to maximize performance
   */
  async getEvents(): Promise<
    {
      uri: string
      name: string
      closerEmail: string
      closerName: string
      startTime: string
      endTime: string
    }[]
  > {
    const logger = createLogger('CalendlyService.getEvents')
    const rateLimiter = createRateLimiter(490) // Leave some buffer under 500 req/min

    try {
      logger.log('Starting Calendly events fetch')

      // Step 1: Get current user
      logger.log('Step 1: Fetching current user')
      const user = await this.fetchCalendly(
        'https://api.calendly.com/users/me',
        GetUserResponseSchema,
        logger,
        rateLimiter,
        'current user'
      )
      const organizationUri = user.resource.current_organization
      logger.success(`Got user: ${user.resource.email}`, { organizationUri })

      // Step 2: Fetch all scheduled events
      logger.log('Step 2: Fetching all scheduled events')
      const eventsData: CalendlyGetEventsResponse['collection'] = []
      let nextPageToken: string | null = null
      let pageCount = 0

      while (true) {
        const url = new URL('https://api.calendly.com/scheduled_events')
        url.searchParams.set('organization', organizationUri)
        url.searchParams.set('count', '100')

        if (nextPageToken) {
          url.searchParams.set('page_token', nextPageToken)
        }

        const response = await this.fetchCalendly(
          url.toString(),
          GetEventsResponseSchema,
          logger,
          rateLimiter,
          `scheduled events page ${pageCount + 1}`
        )

        pageCount++
        eventsData.push(...response.collection)

        if (!response.pagination.next_page_token) break
        nextPageToken = response.pagination.next_page_token
      }

      logger.success(
        `Fetched ${eventsData.length} events across ${pageCount} pages`
      )

      // Step 3: Transform to basic event data
      logger.log('Step 3: Transforming event data')
      const results = eventsData.map((event) => ({
        closerEmail: event.event_memberships[0]?.user_email || '',
        closerName: event.event_memberships[0]?.user_name || '',
        endTime: event.end_time,
        name: event.name,
        startTime: event.start_time,
        uri: event.uri
      }))

      // Final stats
      const finalStats = rateLimiter.getStats()
      logger.success('All data fetched successfully!', {
        requestsRemaining: finalStats.remaining,
        requestsUsed: finalStats.requestCount,
        totalEvents: results.length
      })

      console.log(`[CalendlyService] Fetched ${results.length} events`)

      return results
    } catch (error) {
      logger.error('Failed to fetch Calendly events', error)
      throw error
    }
  }

  /**
   * Fetch all Calendly scheduled events with invitee details
   * Returns data formatted for database insertion
   * Uses smart rate limiting and batching to maximize performance
   */
  async getAllEventsWithInvitees() {
    const logger = createLogger('CalendlyService.getAllEventsWithInvitees')
    const rateLimiter = createRateLimiter(490) // Leave some buffer under 500 req/min

    try {
      console.log('[CalendlyService] Starting Calendly data sync...')

      // Step 1: Get current user
      const user = await this.fetchCalendly(
        'https://api.calendly.com/users/me',
        GetUserResponseSchema,
        logger,
        rateLimiter,
        'current user'
      )
      const organizationUri = user.resource.current_organization

      // Step 2: Fetch all scheduled events
      const eventsData: CalendlyGetEventsResponse['collection'] = []
      let nextPageToken: string | null = null
      let pageCount = 0

      while (true) {
        const url = new URL('https://api.calendly.com/scheduled_events')
        url.searchParams.set('organization', organizationUri)
        url.searchParams.set('count', '100')

        if (nextPageToken) {
          url.searchParams.set('page_token', nextPageToken)
        }

        const response = await this.fetchCalendly(
          url.toString(),
          GetEventsResponseSchema,
          logger,
          rateLimiter,
          `scheduled events page ${pageCount + 1}`
        )

        pageCount++
        eventsData.push(...response.collection)

        if (!response.pagination.next_page_token) break
        nextPageToken = response.pagination.next_page_token
      }

      // Step 3: Process events in parallel batches to fetch invitees
      const eventsBar = new cliProgress.SingleBar(
        {
          clearOnComplete: false,
          format: 'Processing events [{bar}] {percentage}% | {value}/{total}',
          hideCursor: true
        },
        cliProgress.Presets.shades_classic
      )
      eventsBar.start(eventsData.length, 0)

      const results = await this.batchProcessEvents(
        eventsData,
        null,
        rateLimiter,
        eventsBar,
        50 // Process 50 events at a time
      )

      eventsBar.stop()

      // Final summary
      console.log(
        `\n[CalendlyService] ✓ Fetched ${results.length} events with invitees (${pageCount} pages)`
      )

      return results
    } catch (error) {
      logger.error('Failed to fetch Calendly data', error)
      throw error
    }
  }
}

export const CalendlyService = new CalendlyServiceImpl()
