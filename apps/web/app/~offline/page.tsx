'use client'

import Header from '@/components/header'
import { Button } from '@/components/ui/button'
import { hasCachedBusData } from '@/lib/utils/cache'
import { useEffect, useState } from 'react'
import { BiWifi, BiWifiOff } from 'react-icons/bi'
import { FaBus } from 'react-icons/fa'

export default function OfflinePage() {
  const [hasCachedData, setHasCachedData] = useState(false)
  const [isBackOnline, setIsBackOnline] = useState(false)

  useEffect(() => {
    // online イベントはページロード直後に発火する場合がある（ブラウザ差異）ため、
    // 自動リダイレクトせず、UIで通知してユーザー操作に委ねる
    const handleOnline = () => setIsBackOnline(true)
    const handleOffline = () => setIsBackOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    // Cache API からキャッシュ済み時刻表データがあるか確認する
    hasCachedBusData().then(setHasCachedData).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ステータスバナー */}
      {isBackOnline ? (
        <div className="fixed top-20 md:top-16 left-0 right-0 z-40 bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200 text-xs text-center py-1.5 px-3 flex items-center justify-center gap-1.5">
          <BiWifi className="h-3 w-3 shrink-0" />
          <span>オンラインに復帰しました</span>
        </div>
      ) : (
        <div className="fixed top-20 md:top-16 left-0 right-0 z-40 bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 text-xs text-center py-1.5 px-3 flex items-center justify-center gap-1.5">
          <BiWifiOff className="h-3 w-3 shrink-0" />
          <span>オフラインです</span>
        </div>
      )}

      <div
        className="pt-28 md:pt-24 mx-auto max-w-6xl flex flex-col items-center justify-center px-6"
        style={{ minHeight: 'calc(100vh - 7rem)' }}
      >
        {isBackOnline ? (
          <>
            <BiWifi className="h-10 w-10 text-green-500 mb-4" />
            <h1 className="text-lg font-bold mb-1">オンラインに復帰しました</h1>
            <p className="text-sm text-muted-foreground mb-8">ページを再読み込みしてください</p>
          </>
        ) : (
          <>
            <BiWifiOff className="h-10 w-10 text-muted-foreground mb-4" />
            <h1 className="text-lg font-bold mb-1">接続がありません</h1>
            <p className="text-sm text-muted-foreground mb-8">電波の良い場所で再度お試しください</p>
          </>
        )}

        <div className="w-full max-w-xs space-y-3">
          {hasCachedData && (
            <Button asChild className="w-full" variant="default">
              <a href="/~offline/timetable">
                <FaBus className="h-4 w-4" />
                保存済みの時刻表を見る
              </a>
            </Button>
          )}

          <Button
            onClick={() => (window.location.href = '/')}
            variant={isBackOnline ? 'default' : 'outline'}
            className="w-full"
          >
            {isBackOnline ? 'ホームに戻る' : '再読み込み'}
          </Button>
        </div>
      </div>
    </div>
  )
}
