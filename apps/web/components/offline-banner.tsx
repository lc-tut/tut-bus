'use client'

import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
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

  // オフラインになったら dismissed をリセット（外部イベントのコールバック内でsetState）
  useEffect(() => {
    const handleOffline = () => setDismissed(false)
    window.addEventListener('offline', handleOffline)
    return () => window.removeEventListener('offline', handleOffline)
  }, [])

  // キャッシュ済み時刻表データがあるか確認
  useEffect(() => {
    if (isOnline) return
    caches
      .open('bus-timetable-api')
      .then(async (cache) => {
        const keys = await cache.keys()
        const hasTimetable = keys.some((req) => {
          const url = new URL(req.url)
          return (
            url.pathname.includes('/api/bus-stops/groups/') && url.pathname.includes('/timetable')
          )
        })
        setHasCachedData(hasTimetable)
      })
      .catch(() => {})
  }, [isOnline])

  if (isOnline || dismissed) return null

  return (
    <div className="fixed top-20 md:top-16 left-0 right-0 z-40 bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 text-xs text-center py-1.5 px-3 flex items-center justify-center gap-2">
      <BiWifiOff className="h-3 w-3 shrink-0" />
      <span>オフラインです</span>
      {hasCachedData && (
        <Link
          href="/~offline/timetable"
          className="inline-flex items-center gap-1 rounded-full bg-yellow-200 dark:bg-yellow-800/80 px-2.5 py-0.5 font-medium hover:bg-yellow-300 dark:hover:bg-yellow-700/80 transition-colors"
        >
          <FaBus className="h-2.5 w-2.5" />
          保存済み時刻表
        </Link>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="ml-1 rounded-full p-0.5 hover:bg-yellow-300 dark:hover:bg-yellow-700/80 transition-colors"
        aria-label="閉じる"
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
    </div>
  )
}
