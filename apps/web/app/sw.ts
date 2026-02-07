/// <reference types="@serwist/next/typings" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist, StaleWhileRevalidate } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// 許可するAPIオリジン（自オリジン + 環境変数で指定された外部API）
const allowedApiOrigins = new Set([self.location.origin])
const externalApiUrl = process.env.NEXT_PUBLIC_API_URL
if (externalApiUrl) {
  try {
    allowedApiOrigins.add(new URL(externalApiUrl).origin)
  } catch {
    // invalid URL は無視
  }
}

// 1x1 透明GIF（オフライン時の画像フォールバック用）
const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
])

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // ページナビゲーション: NetworkOnly でオフライン時は fallback(/~offline) を表示
    // NetworkFirst だとランタイムキャッシュ(pages-cache)にヒットして壊れたHTMLが表示されてしまう
    // プリキャッシュ済みページ(/~offline 等)は precache route が先にマッチするため影響なし
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkOnly({
        networkTimeoutSeconds: 3,
        plugins: [
          {
            // ナビゲーション失敗時にクライアントへオフライン通知を送信
            // fetchDidFail は handlerDidError と異なりフォールバックプラグインを阻害しない
            fetchDidFail: async () => {
              const clients = await self.clients.matchAll({ type: 'window' })
              for (const client of clients) {
                client.postMessage({ type: 'SW_OFFLINE' })
              }
            },
          },
        ],
      }),
    },
    // RSC (React Server Components) ペイロード: Next.jsのクライアントサイドナビゲーション用
    // _rsc パラメータ付きリクエストはnavigateモードではないため、ナビゲーションルールにマッチしない
    // 明示的にハンドルしないと no-response エラー → ブラウザフォールバック → 無限リロードループになる
    {
      matcher: ({ url }) => url.origin === self.location.origin && url.searchParams.has('_rsc'),
      handler: new NetworkFirst({
        cacheName: 'rsc-cache',
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60,
          }),
          {
            // RSCリクエスト失敗時: 空レスポンスではなくエラーステータスを返す
            // → Next.jsがブラウザナビゲーションにフォールバック → SWのナビゲーション fallback → /~offline
            handlerDidError: async () => Response.error(),
          },
        ],
      }),
    },
    // バス停API: 同一オリジン + NEXT_PUBLIC_API_URL のオリジンを許可
    {
      matcher: ({ url }) =>
        allowedApiOrigins.has(url.origin) && url.pathname.startsWith('/api/bus-stops/'),
      handler: new NetworkFirst({
        cacheName: 'bus-timetable-api',
        networkTimeoutSeconds: 3,
        matchOptions: { ignoreVary: true },
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7日間
          }),
          {
            // 2xx レスポンスのみキャッシュ（エラーレスポンスはキャッシュしない）
            // キャッシュ保存時にタイムスタンプヘッダーを付与（オフライン画面で表示用）
            cacheWillUpdate: async ({ response }) => {
              if (response.status < 200 || response.status >= 300) return null
              const headers = new Headers(response.headers)
              headers.set('x-sw-cached-at', new Date().toISOString())
              return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
              })
            },
          },
          {
            // オフラインかつキャッシュなし → 503 レスポンスを返す（no-response エラー抑制）
            handlerDidError: async () =>
              new Response(
                JSON.stringify({ error: 'offline', message: 'No cached data available' }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' },
                }
              ),
          },
        ],
      }),
    },
    // favicon・画像: キャッシュ優先、オフライン時は透明GIFで代替
    {
      matcher: ({ request }) => request.destination === 'image' || request.url.includes('favicon'),
      handler: new StaleWhileRevalidate({
        cacheName: 'images-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
          {
            handlerDidError: async () =>
              new Response(TRANSPARENT_GIF, {
                headers: { 'Content-Type': 'image/gif' },
              }),
          },
        ],
      }),
    },
    // Auth API: NetworkOnly + オフライン時は空セッションを返す（no-response エラー抑制）
    // defaultCache の auth ルール（NetworkOnly, handlerDidError なし）より先にマッチさせる
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/auth/'),
      handler: new NetworkOnly({
        networkTimeoutSeconds: 10,
        plugins: [
          {
            handlerDidError: async () =>
              new Response(JSON.stringify({ session: null, user: null }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }),
          },
        ],
      }),
    },
    // それ以外は serwist のデフォルトキャッシュ戦略
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document'
        },
      },
    ],
  },
})

// 旧バージョンの SW が作成した stale ランタイムキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([caches.delete('pages-cache'), caches.delete('pages'), caches.delete('others')])
  )
})

serwist.addEventListeners()
