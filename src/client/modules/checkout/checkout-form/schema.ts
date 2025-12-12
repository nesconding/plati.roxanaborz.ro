import { isValidPhoneNumber } from 'libphonenumber-js'
import z from 'zod'

export enum BillingType {
  PERSON = 'PERSON',
  COMPANY = 'COMPANY'
}

export enum CheckoutFormSection {
  BillingData = 'billingData',
  ContractConsent = 'contractConsent'
}

const addressSchema = z.object({
  apartment: z.string().optional(),
  building: z.string().optional(),
  city: z.string().min(1),
  country: z.string().min(1),
  county: z.string().min(1),
  entrance: z.string().optional(),
  floor: z.string().optional(),
  postalCode: z.string().min(1),
  street: z.string().min(1),
  streetNumber: z.string().min(1)
})

export const personSchema = z.object({
  address: addressSchema,
  cnp: z.string().min(13).max(13),
  email: z.email().min(1),
  name: z.string().min(1),
  phoneNumber: z
    .string()
    .refine((phoneNumber) => isValidPhoneNumber(phoneNumber), {
      message: 'Invalid phone number'
    }),
  surname: z.string().min(1),
  type: z.literal(BillingType.PERSON)
})

export const companySchema = z.object({
  bank: z.string().min(1),
  bankAccount: z.string().min(1),
  cui: z.string().min(1),
  name: z.string().min(1),
  registrationNumber: z.string().min(1),
  representativeLegal: z.string().min(1),
  socialHeadquarters: addressSchema,
  type: z.literal(BillingType.COMPANY)
})

// Discriminated union for billing data
export const billingDataSchema = z.discriminatedUnion('type', [
  personSchema,
  companySchema
])

export const contractConsentSchema = z.object({
  contractTermsConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the contract terms'
  }),
  dataProcessingConsent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to data processing'
  })
})

export const CheckoutFormSchema = z.object({
  [CheckoutFormSection.BillingData]: billingDataSchema,
  [CheckoutFormSection.ContractConsent]: contractConsentSchema.optional()
})

export type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>
export type BillingDataFormValues = z.infer<typeof billingDataSchema>
export type PersonFormValues = z.infer<typeof personSchema>
export type CompanyFormValues = z.infer<typeof companySchema>
export type AddressFormValues = z.infer<typeof addressSchema>
export type ContractConsentFormValues = z.infer<typeof contractConsentSchema>

const defaultAddress: AddressFormValues = {
  apartment: '',
  building: '',
  city: '',
  country: '',
  county: '',
  entrance: '',
  floor: '',
  postalCode: '',
  street: '',
  streetNumber: ''
}

export const CheckoutFormDefaultValues: CheckoutFormValues = {
  [CheckoutFormSection.BillingData]: {
    address: defaultAddress,
    cnp: '',
    email: '',
    name: '',
    phoneNumber: '',
    surname: '',
    type: BillingType.PERSON
  },
  [CheckoutFormSection.ContractConsent]: {
    contractTermsConsent: false,
    dataProcessingConsent: false
  }
}

// Helper to get billing data (now just returns the billingData directly since it's already typed)
export function getBillingData(values: CheckoutFormValues) {
  return values[CheckoutFormSection.BillingData]
}
