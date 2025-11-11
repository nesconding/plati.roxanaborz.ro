import 'server-only' // <-- ensure this file cannot be imported from the client

import { cache } from 'react'

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { headers } from 'next/headers'

import { makeQueryClient } from '~/client/trpc/query-client'
import { createTRPCContext } from '~/server/trpc/config'
import { appRouter } from '~/server/trpc/router'

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  return createTRPCContext({
    headers: new Headers(await headers())
  })
})

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient)
export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient
})
