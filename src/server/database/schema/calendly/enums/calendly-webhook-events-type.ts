import { calendly } from '~/server/database/schema/schemas'
import { CalendlyWebhookEventsType } from '~/shared/enums/calendly-webhook-events-type'

export const calendly_webhook_events_type = calendly.enum(
  'calendly_webhook_events_type',
  [
    CalendlyWebhookEventsType.InviteeCreated,
    CalendlyWebhookEventsType.InviteeCanceled
  ]
)
