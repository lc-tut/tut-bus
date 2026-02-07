/* eslint-disable no-undef */
// @ts-check
import withSerwistInit from '@serwist/next'
import { spawnSync } from 'node:child_process'

const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ??
  crypto.randomUUID()

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [
    { url: '/~offline', revision },
    { url: '/~offline/timetable', revision },
    { url: '/manifest.webmanifest', revision },
  ],
  disable: process.env.NODE_ENV !== 'production',
})

// SW の CSP で許可する connect-src オリジンを構築
const swConnectSrc = ["'self'"]
const apiUrl = process.env.NEXT_PUBLIC_API_URL
if (apiUrl) {
  try {
    swConnectSrc.push(new URL(apiUrl).origin)
  } catch {
    // invalid URL
  }
}
const appUrl = process.env.NEXT_PUBLIC_APP_URL
if (appUrl) {
  try {
    swConnectSrc.push(new URL(appUrl).origin)
  } catch {
    // invalid URL
  }
}
// Google Analytics
swConnectSrc.push('https://www.googletagmanager.com', 'https://www.google-analytics.com')

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self'; connect-src ${swConnectSrc.join(' ')}`,
          },
        ],
      },
    ]
  },
}

export default withSerwist(nextConfig)
