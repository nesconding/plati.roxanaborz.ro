import { z } from 'zod'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'

// Paused status is system-managed only, cannot be manually set
const ManualMembershipStatusSchema = z.enum([
  MembershipStatusType.Active,
  MembershipStatusType.Cancelled,
  MembershipStatusType.Delayed
])

export const UpdateMembershipStatusFormSchema = z.object({
  id: z.string().min(1, 'Membership ID is required'),
  status: ManualMembershipStatusSchema
})

export type UpdateMembershipStatusFormValues = z.infer<
  typeof UpdateMembershipStatusFormSchema
>

export const UpdateMembershipStatusFormDefaultValues: UpdateMembershipStatusFormValues =
  {
    id: '',
    status: MembershipStatusType.Active
  }
