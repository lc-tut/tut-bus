'use client'

import { useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * 必須APIデータを先読みしてSWキャッシュを温めるコンポーネント。
 * オンライン時にバス停グループ一覧と各グループの時刻表を取得し、
 * SWのランタイムキャッシュに保存する。
 * オフライン時にCache APIフォールバックで使用可能になる。
 */

// モジュールレベルフラグで重複実行を防ぐ
let cacheWarmingStarted = false

async function warmEssentialCaches() {
  if (cacheWarmingStarted) return
  cacheWarmingStarted = true

  try {
    // まずキャッシュ済みか確認（SWキャッシュに有効なデータがあればスキップ）
    const cache = await caches.open('bus-timetable-api')
    const existingKeys = await cache.keys()
    const hasGroups = existingKeys.some((req) => {
      const url = new URL(req.url)
      return url.pathname === '/api/bus-stops/groups'
    })

    // バス停グループ一覧を取得（SW経由でキャッシュされる）
    const groupsResponse = await fetch(`${API_URL}/api/bus-stops/groups`)
    if (!groupsResponse.ok) return

    const groups = (await groupsResponse.json()) as { id: number; name: string }[]
    if (!groups || groups.length === 0) return

    // 既にグループキャッシュがある場合、時刻表もキャッシュ済みの可能性が高いのでスキップ
    if (hasGroups) {
      // ただし時刻表のキャッシュがあるか確認
      const hasTimetable = existingKeys.some((req) => {
        const url = new URL(req.url)
        return url.pathname.includes('/timetable')
      })
      if (hasTimetable) return
    }

    // 各グループの時刻表を取得（SW経由でキャッシュされる）
    // UTC ではなくローカル日付を使用（JST 等で日付がずれないように）
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const timetablePromises = groups.map((group) =>
      fetch(`${API_URL}/api/bus-stops/groups/${group.id}/timetable?date=${today}`).catch(() => {
        // 個別のエラーは無視
      })
    )
    await Promise.allSettled(timetablePromises)
  } catch {
    // キャッシュウォーミングの失敗は静かに無視
    // 次回のオンライン時に再試行される
  }
}

export function CacheWarmer() {
  useEffect(() => {
    // SWが登録されていない場合は何もしない
    if (!('serviceWorker' in navigator)) return

    // オンライン時のみキャッシュを温める
    if (!navigator.onLine) return

    // 初回描画のパフォーマンスに影響しないよう遅延実行
    const timer = setTimeout(() => {
      warmEssentialCaches()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return null
}
