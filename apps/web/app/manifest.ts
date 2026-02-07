import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '東京工科大学 - バスNavi',
    short_name: 'バスNavi',
    description: '東京工科大学のバスの時刻表や運行情報を提供するアプリです。',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3a4d91',
    lang: 'ja',
    screenshots: [
      {
        src: '/screenshot-1.png',
        sizes: '1080x2400',
        type: 'image/png',
      },
      {
        src: '/screenshot-2.png',
        sizes: '1080x2400',
        type: 'image/png',
      },
      {
        src: '/screenshot-3.png',
        sizes: '1080x2400',
        type: 'image/png',
      },
      {
        src: '/screenshot-4.png',
        sizes: '1080x2400',
        type: 'image/png',
      },
    ],
    icons: [
      {
        src: '/logo-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/logo-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/logo-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo-1024x1024.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
    // @ts-expect-error -- launch_handler is not yet in Next.js types
    launch_handler: {
      client_mode: 'navigate-existing',
    },
  }
}
