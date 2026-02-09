import { createId } from '@paralleldrive/cuid2'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { memberships } from '~/server/database/schema/business/models/membership'
import { protectedProcedure } from '~/server/trpc/config'
import { MembershipStatusType } from '~/shared/enums/membership-status-type'

const inputSchema = z
  .object({
    customerEmail: z.string().email('Must be a valid email address'),
    customerName: z.string().optional(),
    delayedStartDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime(),
    parentOrderId: z.string().nullable().optional(),
    productName: z.string().min(1, 'Product name is required'),
    startDate: z.string().datetime(),
    status: z.nativeEnum(MembershipStatusType)
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate']
  })

export const createMembershipProcedure = protectedProcedure
  .input(inputSchema)
  .mutation(async ({ input, ctx }) => {
    const {
      customerEmail,
      customerName,
      delayedStartDate,
      endDate,
      parentOrderId,
      productName,
      startDate,
      status
    } = input

    try {
      const id = createId()

      await ctx.db.insert(memberships).values({
        customerEmail,
        customerName: customerName || null,
        delayedStartDate: delayedStartDate || null,
        endDate,
        id,
        parentOrderId: parentOrderId || null,
        productName,
        startDate,
        status
      })

      return {
        id,
        message: 'Membership created successfully',
        success: true
      }
    } catch (cause) {
      throw new TRPCError({
        cause,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create membership'
      })
    }
  })
