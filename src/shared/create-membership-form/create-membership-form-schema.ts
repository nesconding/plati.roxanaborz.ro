import { z } from 'zod'

import { MembershipStatusType } from '~/shared/enums/membership-status-type'

export const CreateMembershipFormSchema = z.object({
  customerEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  customerName: z.string().optional(),
  delayedStartDate: z.date().nullable().optional(),
  endDate: z.date(),
  parentOrderId: z.string().nullable().optional(),
  productName: z.string().min(1, 'Product is required'),
  startDate: z.date(),
  status: z.nativeEnum(MembershipStatusType)
})

export type CreateMembershipFormValues = z.infer<
  typeof CreateMembershipFormSchema
>

export const CreateMembershipFormDefaultValues: CreateMembershipFormValues = {
  customerEmail: '',
  customerName: '',
  delayedStartDate: null,
  endDate: new Date(),
  parentOrderId: null,
  productName: '',
  startDate: new Date(),
  status: MembershipStatusType.Active
}
