import { isValidPhoneNumber } from 'libphonenumber-js'
import z from 'zod'

export enum CheckoutFormSection {
  Address = 'address',
  PersonalDetails = 'personal-details'
}

export const CheckoutFormSchema = z.object({
  [CheckoutFormSection.Address]: z.object({
    city: z.string().nonempty(),
    country: z.string().nonempty(),
    line1: z.string().nonempty(),
    line2: z.string().optional(),
    postal_code: z.string().nonempty(),
    state: z.string().nonempty()
  }),
  [CheckoutFormSection.PersonalDetails]: z.object({
    email: z.email().nonempty(),
    name: z.string().nonempty(),
    phoneNumber: z.union([
      z.literal('').optional(),
      z.string().refine((phoneNumber) => isValidPhoneNumber(phoneNumber))
    ])
  })
})

export type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>

export const CheckoutFormDefaultValues: CheckoutFormValues = {
  [CheckoutFormSection.Address]: {
    // city: '',
    // country: '',
    // line1: '',
    // line2: '',
    // postal_code: '',
    // state: ''
    city: 'Bucuresti',
    country: 'RO',
    line1: 'Strada 1',
    line2: 'Bl. 1',
    postal_code: '100000',
    state: 'Bucuresti'
  },
  [CheckoutFormSection.PersonalDetails]: {
    email: '',
    name: '',
    phoneNumber: ''
  }
}
