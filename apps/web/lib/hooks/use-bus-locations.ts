'use client'

import { BusLocation, BusLocationSlug, fetchBusLocations } from '@/lib/bus-location'
import { useEffect, useState } from 'react'

// 公式ページは 5 秒間隔で取得しているが、負荷を考えて少し長めにする
const POLL_INTERVAL_MS = 10000

export interface BusLocationsState {
  buses: BusLocation[]
  error: boolean
  loaded: boolean
  // 最後に取得できた時刻（epoch ms）
  fetchedAt: number | null
}

const initialState: BusLocationsState = {
  buses: [],
  error: false,
  loaded: false,
  fetchedAt: null,
}

// 同じ路線を複数のコンポーネントが見ていても、取得は路線ごとに1本にまとめる
interface Poller {
  state: BusLocationsState
  listeners: Set<(state: BusLocationsState) => void>
  stop: () => void
}

const pollers = new Map<BusLocationSlug, Poller>()

function startPoller(slug: BusLocationSlug): Poller {
  let controller: AbortController | null = null
  let timerId: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  const poller: Poller = {
    state: initialState,
    listeners: new Set(),
    stop: () => {
      stopped = true
      controller?.abort()
      if (timerId) clearTimeout(timerId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    },
  }

  const emit = (state: BusLocationsState) => {
    poller.state = state
    poller.listeners.forEach((listener) => listener(state))
  }

  const load = async () => {
    controller?.abort()
    controller = new AbortController()
    try {
      const all = await fetchBusLocations(slug, controller.signal)
      if (stopped) return
      const buses = all.filter((bus) => bus.trip_status === 'running')
      emit({ buses, error: false, loaded: true, fetchedAt: Date.now() })
    } catch (err) {
      if (stopped || (err instanceof DOMException && err.name === 'AbortError')) return
      emit({ ...poller.state, error: true, loaded: true })
    }
  }

  const schedule = () => {
    timerId = setTimeout(async () => {
      // タブが裏にあるときは取得しない
      if (!document.hidden) await load()
      if (!stopped) schedule()
    }, POLL_INTERVAL_MS)
  }

  function onVisibilityChange() {
    if (!document.hidden) load()
  }

  load().then(() => {
    if (!stopped) schedule()
  })
  document.addEventListener('visibilitychange', onVisibilityChange)

  return poller
}

function subscribe(slug: BusLocationSlug, listener: (state: BusLocationsState) => void) {
  let poller = pollers.get(slug)
  if (!poller) {
    poller = startPoller(slug)
    pollers.set(slug, poller)
  }
  poller.listeners.add(listener)
  listener(poller.state)

  return () => {
    const current = pollers.get(slug)
    if (!current) return
    current.listeners.delete(listener)
    if (current.listeners.size === 0) {
      current.stop()
      pollers.delete(slug)
    }
  }
}

// 路線を走っているバスを両方向とも返す（slug が null のあいだは取得しない）
export function useBusLocations(slug: BusLocationSlug | null): BusLocationsState {
  const [state, setState] = useState<{ slug: BusLocationSlug | null; value: BusLocationsState }>({
    slug: null,
    value: initialState,
  })

  useEffect(() => {
    if (!slug) return
    return subscribe(slug, (value) => setState({ slug, value }))
  }, [slug])

  // 路線を切り替えた直後に前の路線のバスを出さない
  return slug && state.slug === slug ? state.value : initialState
}
