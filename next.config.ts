import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  turbopack: {
    rules: {
      '*.svg': {
        as: '*.js',
        loaders: ['@svgr/webpack']
      }
    }
  }
}

const withNextIntl = createNextIntlPlugin('./src/client/lib/i18n/request.ts')
export default withNextIntl(nextConfig)
