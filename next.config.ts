import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  },
  reactStrictMode: true
}

const withNextIntl = createNextIntlPlugin('./src/client/lib/i18n/request.ts')
export default withNextIntl(nextConfig)
