import { calendly } from '~/server/database/schema/schemas'
import { CalendlyScheduledEventsStatusType } from '~/shared/enums/calendly-scheduled-events-status-type'

export const calendly_scheduled_events_status_type = calendly.enum(
  'calendly_scheduled_events_status_type',
  [
    CalendlyScheduledEventsStatusType.Active,
    CalendlyScheduledEventsStatusType.Canceled
  ]
)
