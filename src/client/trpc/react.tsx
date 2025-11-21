'use client'

import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCContext } from '@trpc/tanstack-react-query'
// ^-- to make sure we can mount the Provider from a server component
import { useState } from 'react'
import superjson from 'superjson'

import { makeQueryClient } from '~/client/trpc/query-client'
import type { AppRouter } from '~/server/trpc/router'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()
let clientQueryClientSingleton: QueryClient
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  // biome-ignore lint/suspicious/noAssignInExpressions: <>
  return (clientQueryClientSingleton ??= makeQueryClient())
}
function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    return process.env.BASE_URL!
  })()
  return `${base}/api/trpc`
}

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode
  }>
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl()
        })
      ]
    })
  )
  return (
    <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </TRPCProvider>
  )
}

export type TRPCRouterInput = inferRouterInputs<AppRouter>
export type TRPCRouterOutput = inferRouterOutputs<AppRouter>
