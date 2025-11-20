import { text, timestamp } from 'drizzle-orm/pg-core'
import { calendly_scheduled_events_status_type } from '~/server/database/schema/calendly/enums/calendly-scheduled-events-status-type'
import { calendly } from '~/server/database/schema/schemas'
import { id, timestamps } from '~/server/database/schema/utils'

export const calendly_scheduled_events = calendly.table(
  'calendly_scheduled_events',
  {
    ...id,

    closerEmail: text('closer_email').notNull(),
    closerName: text('closer_name').notNull(),
    endTime: timestamp('end_time', {
      mode: 'string',
      withTimezone: true
    }).notNull(),
    inviteeEmail: text('invitee_email').notNull(),
    inviteeName: text('invitee_name'),
    inviteePhoneNumber: text('invitee_phone_number'),
    inviteeUri: text('invitee_uri').notNull(),
    name: text('name'),
    startTime: timestamp('start_time', {
      mode: 'string',
      withTimezone: true
    }).notNull(),
    status: calendly_scheduled_events_status_type('status').notNull(),
    uri: text('uri').unique().notNull(),

    ...timestamps
  }
)
