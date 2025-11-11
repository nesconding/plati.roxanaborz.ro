import { isValidPhoneNumber } from 'libphonenumber-js'
import { z } from 'zod'

export const UserPhoneSchema = z
  .string()
  .refine(
    (phoneNumber) => phoneNumber === '' || isValidPhoneNumber(phoneNumber)
  )
