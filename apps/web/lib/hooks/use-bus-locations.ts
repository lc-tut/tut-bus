'use client'

import { BusLocation, BusLocationRoute, fetchBusLocations } from '@/lib/bus-location'
import { useEffect, useState } from 'react'

// 公式ページは 5 秒間隔で取得しているが、負荷を考えて少し長めにする
const POLL_INTERVAL_MS = 10000

interface BusLocationsState {
  buses: BusLocation[]
  error: boolean
  loaded: boolean
  // 最後に取得できた時刻（epoch ms）
  fetchedAt: number | null
}

export function useBusLocations(route: BusLocationRoute | null): BusLocationsState {
  const slug = route?.slug
  const direction = route?.direction
  const [state, setState] = useState<BusLocationsState>({
    buses: [],
    error: false,
    loaded: false,
    fetchedAt: null,
  })

  useEffect(() => {
    if (!slug || !direction) return

    let controller: AbortController | null = null
    let timerId: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const load = async () => {
      controller?.abort()
      controller = new AbortController()
      try {
        const all = await fetchBusLocations(slug, controller.signal)
        if (cancelled) return
        const buses = all.filter(
          (bus) => bus.direction === direction && bus.trip_status === 'running'
        )
        setState({ buses, error: false, loaded: true, fetchedAt: Date.now() })
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return
        setState((prev) => ({ ...prev, error: true, loaded: true }))
      }
    }

    const schedule = () => {
      timerId = setTimeout(async () => {
        // タブが裏にあるときは取得しない
        if (!document.hidden) await load()
        if (!cancelled) schedule()
      }, POLL_INTERVAL_MS)
    }

    const onVisibilityChange = () => {
      if (!document.hidden) load()
    }

    load().then(() => {
      if (!cancelled) schedule()
    })
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      controller?.abort()
      if (timerId) clearTimeout(timerId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      setState({ buses: [], error: false, loaded: false, fetchedAt: null })
    }
  }, [slug, direction])

  return state
}
