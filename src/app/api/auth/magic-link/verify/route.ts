import { toNextJsHandler } from 'better-auth/next-js'

import { authentication } from '~/server/services/authentication'

export const { GET } = toNextJsHandler(authentication.handler)
