import { business } from '~/server/database/schema/schemas'
import { SubscriptionStatusType } from '~/shared/enums/subscription-status-type'

export const subscription_status_type = business.enum(
  'subscription_status_type',
  [
    SubscriptionStatusType.Active,
    SubscriptionStatusType.OnHold,
    SubscriptionStatusType.Cancelled,
    SubscriptionStatusType.Completed
  ]
)
