import { z } from 'zod'

export const UpdateMembershipDatesFormSchema = z
  .object({
    delayedStartDate: z.date().nullable(),
    endDate: z.date(),
    id: z.string().min(1, 'Membership ID is required'),
    startDate: z.date()
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate']
  })

export type UpdateMembershipDatesFormValues = z.infer<
  typeof UpdateMembershipDatesFormSchema
>

export const UpdateMembershipDatesFormDefaultValues: Partial<UpdateMembershipDatesFormValues> =
  {
    delayedStartDate: null,
    id: ''
  }
