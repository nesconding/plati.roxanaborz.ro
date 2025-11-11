import { getRequestConfig } from 'next-intl/server'

import messages from '~/client/lib/i18n/dictionaries/ro'

export default getRequestConfig(() => ({
  locale: 'ro',
  messages
}))
