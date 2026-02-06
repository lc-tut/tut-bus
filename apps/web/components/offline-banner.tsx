'use client'

import { useSyncExternalStore } from 'react'
import { BiWifiOff } from 'react-icons/bi'

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

  if (isOnline) return null

  return (
    <div className="fixed top-20 md:top-16 left-0 right-0 z-40 bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 text-xs text-center py-1.5 px-3 flex items-center justify-center gap-1.5">
      <BiWifiOff className="h-3 w-3 shrink-0" />
      <span>オフラインです。保存済みデータを表示しています。</span>
    </div>
  )
}
