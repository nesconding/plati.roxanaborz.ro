import { text } from 'drizzle-orm/pg-core'
import { calendly_webhook_events_type } from '~/server/database/schema/calendly/enums/calendly-webhook-events-type'
import { calendly } from '~/server/database/schema/schemas'
import { id, timestamps } from '~/server/database/schema/utils'

export const calendly_webhooks = calendly.table('calendly_webhooks', {
  ...id,

  events: calendly_webhook_events_type('events').array().notNull(),
  signing_key: text('signing_key').notNull(),
  uri: text('uri').notNull().unique(),
  url: text('url').notNull(),

  ...timestamps
})
