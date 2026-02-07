'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { BiWifiOff } from 'react-icons/bi'
import { FaBus } from 'react-icons/fa'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [hasCachedData, setHasCachedData] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  // SW からのオフライン通知 or fetch ベースの接続チェック
  const [swDetectedOffline, setSwDetectedOffline] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // SW からの SW_OFFLINE メッセージを受信
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SW_OFFLINE') {
        setSwDetectedOffline(true)
        setDismissed(false)
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  // 実際のネットワーク到達性を定期チェック（navigator.onLine が信頼できない場合の補完）
  const checkConnectivity = useCallback(async () => {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 5000)
    try {
      // HEAD リクエストは SW の GET ルートにマッチしないため、実際のネットワークを経由する
      await fetch(window.location.origin, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      })
      setSwDetectedOffline(false)
    } catch {
      setSwDetectedOffline(true)
    } finally {
      clearTimeout(tid)
    }
  }, [])

  // navigator.onLine が true でも実際にはオフラインの場合があるため、定期チェックを実施
  useEffect(() => {
    if (!isOnline) {
      // ブラウザがオフラインを検知済みなら fetch チェック不要
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    // オンライン復帰時: SW_OFFLINE 状態をリセットするためにチェック（初回は遅延実行）
    const initialCheck = setTimeout(checkConnectivity, 100)
    intervalRef.current = setInterval(checkConnectivity, 30000)
    return () => {
      clearTimeout(initialCheck)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isOnline, checkConnectivity])

  // オフラインになったら dismissed をリセット
  useEffect(() => {
    const handleOffline = () => setDismissed(false)
    window.addEventListener('offline', handleOffline)
    return () => window.removeEventListener('offline', handleOffline)
  }, [])

  const effectivelyOffline = !isOnline || swDetectedOffline

  // キャッシュ済み時刻表データがあるか確認（実際にバス便があるもののみ）
  useEffect(() => {
    if (!effectivelyOffline) return
    if (!('caches' in window)) return
    caches
      .open('bus-timetable-api')
      .then(async (cache) => {
        const keys = await cache.keys()
        for (const req of keys) {
          const url = new URL(req.url)
          if (
            !url.pathname.includes('/api/bus-stops/groups/') ||
            !url.pathname.includes('/timetable')
          )
            continue
          const resp = await cache.match(req)
          if (!resp || !resp.ok) continue
          try {
            const data = await resp.clone().json()
            if (data?.segments) {
              let busCount = 0
              for (const seg of data.segments) {
                busCount += seg.segmentType === 'fixed' ? (seg.times?.length ?? 0) : 1
              }
              if (busCount > 0) {
                setHasCachedData(true)
                return
              }
            }
          } catch {
            continue
          }
        }
        setHasCachedData(false)
      })
      .catch(() => {})
  }, [effectivelyOffline])

  if (!effectivelyOffline || dismissed) return null

  return (
    <div className="fixed top-20 md:top-16 left-0 right-0 z-40 bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 text-xs text-center py-1.5 px-3 flex items-center justify-center gap-2">
      <BiWifiOff className="h-3 w-3 shrink-0" />
      <span>オフラインです</span>
      {hasCachedData && (
        <a
          href="/~offline/timetable"
          className="inline-flex items-center gap-1 rounded-full bg-yellow-200 dark:bg-yellow-800/80 px-2.5 py-0.5 font-medium hover:bg-yellow-300 dark:hover:bg-yellow-700/80 transition-colors"
        >
          <FaBus className="h-2.5 w-2.5" />
          保存済み時刻表
        </a>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="ml-1 rounded-full p-0.5 hover:bg-yellow-300 dark:hover:bg-yellow-700/80 transition-colors"
        aria-label="閉じる"
      >
        <svg
          className="h-3 w-3"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
    </div>
  )
}
