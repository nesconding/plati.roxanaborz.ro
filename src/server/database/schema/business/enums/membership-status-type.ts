import { business } from '~/server/database/schema/schemas'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'

export const membership_status_type = business.enum('membership_status_type', [
  MembershipStatusType.Active,
  MembershipStatusType.Paused,
  MembershipStatusType.Cancelled,
  MembershipStatusType.Delayed
])
