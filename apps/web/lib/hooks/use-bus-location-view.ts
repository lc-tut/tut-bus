'use client'

import { components } from '@/generated/oas'
import { BusLocationRoute, BusRoutePath, fetchBusRoutePath } from '@/lib/bus-location'
import { buildBusLocationView, getRouteStops } from '@/lib/bus-location-view'
import { useBusLocations } from '@/lib/hooks/use-bus-locations'
import { useEffect, useMemo, useState } from 'react'

type BusStopGroup = components['schemas']['Models.BusStopGroup']

// 路線と向きから、地図と一覧に出すデータをまとめて作る
export function useBusLocationView(
  route: BusLocationRoute | null,
  busStopGroups: BusStopGroup[],
  { enabled, withRoutePath }: { enabled: boolean; withRoutePath: boolean }
) {
  const { buses, error, loaded, fetchedAt } = useBusLocations(route && enabled ? route.slug : null)
  const [routePath, setRoutePath] = useState<{ key: string; path: BusRoutePath | null }>()
  const routeKey = route ? `${route.slug}:${route.direction}` : null

  useEffect(() => {
    if (!route || !routeKey || !enabled || !withRoutePath) return
    let cancelled = false
    fetchBusRoutePath(route).then((path) => {
      if (!cancelled) setRoutePath({ key: routeKey, path })
    })
    return () => {
      cancelled = true
    }
  }, [route, routeKey, enabled, withRoutePath])

  const stops = useMemo(
    () => (route ? getRouteStops(route, busStopGroups) : null),
    [route, busStopGroups]
  )
  const view = useMemo(
    () => (route && stops ? buildBusLocationView(route, buses, stops, fetchedAt) : null),
    [route, buses, stops, fetchedAt]
  )

  return {
    view,
    loaded,
    error,
    routePath: routePath?.key === routeKey ? routePath.path : null,
  }
}
