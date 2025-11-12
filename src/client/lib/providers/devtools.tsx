'use client'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { FormDevtoolsPlugin } from '@tanstack/react-form-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Devtools() {
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <>
      <ReactQueryDevtools buttonPosition='bottom-left' />
      <TanStackDevtools plugins={[FormDevtoolsPlugin()]} />
    </>
  )
}
