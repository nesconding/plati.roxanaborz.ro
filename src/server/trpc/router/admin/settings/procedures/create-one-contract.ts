import { createId } from '@paralleldrive/cuid2'
import { TRPCError } from '@trpc/server'
import { put } from '@vercel/blob'
import z from 'zod'

import { contracts } from '~/server/database/schema'
import { adminProcedure } from '~/server/trpc/config'

const input = z.object({
  file: z.object({
    data: z.string(), // Base64 encoded
    originalName: z.string()
  }),
  name: z.string().min(1)
})

export const createOneContractProcedure = adminProcedure
  .input(input)
  .mutation(async ({ ctx, input }) => {
    const contractId = createId()
    const originalNameWithoutExt = input.file.originalName.replace(
      /\.pdf$/i,
      ''
    )
    const blobFilename = `${originalNameWithoutExt}_${contractId}.pdf`

    try {
      const fileBuffer = Buffer.from(input.file.data, 'base64')

      const blob = await put(`contracts/${blobFilename}`, fileBuffer, {
        access: 'public',
        contentType: 'application/pdf'
      })

      await ctx.db.insert(contracts).values({
        id: contractId,
        name: input.name,
        pathname: blob.url
      })

      return { id: contractId, pathname: blob.url }
    } catch (cause) {
      console.error(cause)
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create contract'
      })
    }
  })
