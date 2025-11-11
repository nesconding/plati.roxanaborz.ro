import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'
import superjson from 'superjson'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending'
      },
      hydrate: {
        deserializeData: superjson.deserialize
      },
      queries: {
        // Add this debugging
        queryFn: async (context) => {
          console.trace('🔍 Query called:', context.queryKey) // Shows call stack
          throw new Error('Default queryFn should not be called')
        },
        staleTime: 30 * 1000,

        // Add this to track queries
        throwOnError: (error, query) => {
          console.log('Query error:', query.queryKey)
          return true
        }
      }
    }
  })
}
