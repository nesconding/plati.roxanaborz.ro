import { z } from 'zod'

export function NumericLiteral(numberSchema: z.ZodNumber = z.number()) {
  return z
    .string()
    .transform((val, ctx) => {
      const num = Number(val)
      if (Number.isNaN(num) || val.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          message: 'Must be a valid number string'
        })
        return z.NEVER
      }
      return num
    })
    .pipe(numberSchema)
    .transform((num) => String(num) as `${number}`)
}

export function NumericString() {
  return z
    .string()
    .nonempty()
    .transform(Number)
    .pipe(z.number().positive())
    .transform(String)
}

export function NonNegativeNumericString() {
  return z
    .string()
    .nonempty()
    .transform(Number)
    .pipe(z.number().nonnegative())
    .transform(String)
}
