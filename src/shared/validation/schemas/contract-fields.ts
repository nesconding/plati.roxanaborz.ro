import { z } from 'zod'

import { PaymentMethodType } from '~/shared/enums/payment-method-type'
import { NumericString } from '~/shared/validation/utils'

export const CONTRACT_FIELDS_MAP = {
  PF: {
    address: 'PF_ADRESA',
    cnp: 'PF_CNP',
    email: 'PF_EMAIL',
    name: 'PF_NUME',
    phoneNumber: 'PF_TELEFON'
  },
  PJ: {
    bank: 'PJ_BANCA',
    bankAccount: 'PJ_CONT_BANCAR',
    cui: 'PJ_CUI',
    name: 'PJ_NUME',
    registrationNumber: 'PJ_NUMAR_INREGISTRARE',
    representativeLegal: 'PJ_REPREZENTANT_LEGAL',
    socialHeadquarters: 'PJ_SEDIU_SOCIAL'
  },
  paymentTotal: 'PRET_TOTAL',
  paymentType: 'TIP_PLATA',
  programName: 'PROGRAM'
} as const

export const contractAddressSchema = z.object({
  apartment: z.string(),
  building: z.string(),
  city: z.string(),
  country: z.string(),
  county: z.string(),
  entrance: z.string(),
  floor: z.string(),
  postalCode: z.string(),
  street: z.string(),
  streetNumber: z.string()
})

export enum ContractType {
  PERSON = 'PERSON',
  COMPANY = 'COMPANY'
}

export const contractPersonSchema = z.object({
  address: contractAddressSchema,
  cnp: z.string(),
  email: z.string(),
  name: z.string(),
  phoneNumber: z.string(),
  surname: z.string(),
  type: z.literal(ContractType.PERSON)
})

export const contractCompanySchema = z.object({
  bank: z.string(),
  bankAccount: z.string(),
  cui: z.string(),
  name: z.string(),
  registrationNumber: z.string(),
  representativeLegal: z.string(),
  socialHeadquarters: contractAddressSchema,
  type: z.literal(ContractType.COMPANY)
})

export const ContractFieldsSchema = z
  .discriminatedUnion('type', [contractPersonSchema, contractCompanySchema])
  .and(
    z.object({
      paymentTotal: NumericString(),
      paymentType: z.enum(PaymentMethodType)
    })
  )
