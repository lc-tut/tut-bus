'use client'

import type { BusMapStop } from '@/components/bus-location/bus-map'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { components } from '@/generated/oas'
import {
  BusCongestion,
  BusLocation,
  BusRoutePath,
  congestionLabels,
  distanceMeters,
  fetchBusRoutePath,
  resolveBusLocationRoute,
} from '@/lib/bus-location'
import { useBusLocations } from '@/lib/hooks/use-bus-locations'
import { useIsDesktop } from '@/lib/hooks/use-is-desktop'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FaArrowRight, FaBus, FaExpand, FaMapMarkerAlt } from 'react-icons/fa'

const BusMap = dynamic(() => import('@/components/bus-location/bus-map'), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 rounded-none" />,
})

type BusStopGroup = components['schemas']['Models.BusStopGroup']

interface BusLocationPanelProps {
  departureGroup: BusStopGroup
  destinationStopId: number | null
  busStopGroups: BusStopGroup[]
}

interface BusListItem {
  bus: BusLocation
  distance: number | null
  ageSeconds: number | null
}

const congestionClassNames: Record<BusCongestion, string> = {
  low: 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300',
  medium:
    'bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-300',
  high: 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-800 dark:text-red-300',
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}秒前`
  return `${Math.floor(seconds / 60)}分前`
}

// 画面内に入ったら true になる（カルーセルの画面外のカードで地図を作らないため）
function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '100px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, inView }
}

function LiveDot() {
  return (
    <span className="relative flex size-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
      <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
    </span>
  )
}

function CongestionBadge({ congestion }: { congestion: BusCongestion | null }) {
  if (!congestion) return null
  return (
    <Badge variant="outline" className={cn('text-[10px]', congestionClassNames[congestion])}>
      {congestionLabels[congestion]}
    </Badge>
  )
}

function BusList({ items, targetName }: { items: BusListItem[]; targetName: string }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-5 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <FaBus className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">この方面を走っているバスはありません</p>
      </div>
    )
  }
  return (
    <ul className="divide-y">
      {items.map(({ bus, distance, ageSeconds }) => (
        <li
          key={bus.bus_id}
          className={cn('flex items-center gap-3 px-4 py-3', bus.stale && 'opacity-50')}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <FaBus className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{bus.name}</div>
            {distance !== null && (
              <div className="text-xs text-muted-foreground truncate">
                {targetName}まで約{formatDistance(distance)}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <CongestionBadge congestion={bus.congestion} />
            {ageSeconds !== null && (
              <span className="text-[10px] text-muted-foreground">
                {bus.stale ? '位置が古い' : formatAge(ageSeconds)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function SourceNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-[10px] text-muted-foreground', className)}>
      位置情報: 片柳学園（イマロケ）・直線距離のため実際の道のりとは異なります
    </p>
  )
}

/**
 * 選択中の出発地・行先を走っているバスの現在地を地図で表示する
 */
export function BusLocationPanel({
  departureGroup,
  destinationStopId,
  busStopGroups,
}: BusLocationPanelProps) {
  const isDesktop = useIsDesktop()
  const { ref, inView } = useInView<HTMLDivElement>()
  const [isOpen, setIsOpen] = useState(false)
  const [routePath, setRoutePath] = useState<{ key: string; path: BusRoutePath | null }>()

  const route = useMemo(
    () =>
      resolveBusLocationRoute(
        departureGroup.busStops.map((stop) => stop.id),
        destinationStopId
      ),
    [departureGroup, destinationStopId]
  )
  const routeKey = route ? `${route.slug}:${route.direction}` : null

  // 画面に見えているか、地図を開いているときだけ取得する
  const { buses, error, loaded, fetchedAt } = useBusLocations(
    route && (inView || isOpen) ? route : null
  )

  useEffect(() => {
    if (!route || !routeKey || !inView) return
    let cancelled = false
    fetchBusRoutePath(route).then((path) => {
      if (!cancelled) setRoutePath({ key: routeKey, path })
    })
    return () => {
      cancelled = true
    }
  }, [route, routeKey, inView])

  // 地図に出す出発地・行先（バス停名はグループ名を使う）
  const { stops, targetName } = useMemo(() => {
    if (!route) return { stops: [] as BusMapStop[], targetName: '' }
    const find = (stopId: number) => {
      const group = busStopGroups.find((g) => g.busStops.some((s) => s.id === stopId))
      const stop = group?.busStops.find((s) => s.id === stopId)
      return group && stop?.lat !== undefined && stop.lng !== undefined
        ? { name: group.name, lat: stop.lat, lng: stop.lng }
        : null
    }
    const origin = find(route.originStopId)
    const target = find(route.targetStopId)
    const result: BusMapStop[] = []
    if (origin) result.push({ ...origin, kind: 'departure' })
    if (target) result.push({ ...target, kind: 'destination' })
    return { stops: result, targetName: target?.name ?? '' }
  }, [route, busStopGroups])

  if (!route) return null

  const target = stops.find((stop) => stop.kind === 'destination')
  const items: BusListItem[] = buses
    .map((bus) => ({
      bus,
      distance: target ? distanceMeters(bus.lat, bus.lon, target.lat, target.lng) : null,
      ageSeconds: fetchedAt
        ? Math.max(0, Math.round((fetchedAt - new Date(bus.recorded_at).getTime()) / 1000))
        : null,
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
  const nearest = items.find((item) => !item.bus.stale) ?? items[0]
  const currentPath = routePath?.key === routeKey ? routePath.path : null
  const latestAge = items.reduce<number | null>(
    (min, item) => (item.ageSeconds === null ? min : Math.min(min ?? Infinity, item.ageSeconds)),
    null
  )

  const statusText = !loaded
    ? '位置情報を取得中...'
    : error && items.length === 0
      ? '位置情報を取得できませんでした'
      : items.length === 0
        ? '運行中のバスはありません'
        : `${items.length}台が運行中`

  const routeHeader = (
    <div className="space-y-2">
      <div className="flex items-center">
        <Badge
          variant="outline"
          className="mr-3 bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300 text-xs whitespace-nowrap flex items-center"
        >
          <FaMapMarkerAlt className="mr-1 size-3" />
          出発地
        </Badge>
        <span className="font-bold text-sm">{departureGroup.name}</span>
      </div>
      <div className="flex items-center">
        <Badge
          variant="outline"
          className="mr-3 bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300 text-xs whitespace-nowrap flex items-center"
        >
          <FaArrowRight className="mr-1 size-3" />
          行先
        </Badge>
        <span className="font-bold text-sm">{targetName}</span>
      </div>
    </div>
  )

  return (
    <div ref={ref} className="border-b">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className="bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300 text-xs whitespace-nowrap flex items-center gap-1.5"
          >
            <LiveDot />
            現在地
          </Badge>
          <span className="text-sm font-semibold truncate">{statusText}</span>
        </div>
        {latestAge !== null && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatAge(latestAge)}に更新
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          ;(document.activeElement as HTMLElement)?.blur()
          setIsOpen(true)
        }}
        className="group block w-full px-4 text-left focus-visible:outline-none"
        aria-label="バスの現在地を地図で大きく表示"
      >
        <div className="relative h-40 sm:h-48 overflow-hidden rounded-md border group-focus-visible:ring-2 group-focus-visible:ring-ring">
          {inView && !isOpen ? (
            <BusMap
              buses={buses}
              routePath={currentPath}
              stops={stops}
              className="absolute inset-0"
            />
          ) : (
            <Skeleton className="absolute inset-0 rounded-none" />
          )}
          <span className="pointer-events-none absolute right-2 bottom-2 flex items-center gap-1 rounded-md border bg-background/90 px-2 py-1 text-xs font-medium shadow-sm group-hover:bg-background">
            <FaExpand className="size-3" />
            拡大
          </span>
        </div>
      </button>

      <div className="flex items-center gap-2 px-4 py-2 min-h-[40px]">
        {nearest ? (
          <>
            <FaBus className="size-3.5 shrink-0 text-primary" />
            <span className="text-sm font-medium shrink-0">{nearest.bus.name}</span>
            {nearest.distance !== null && (
              <span className="text-xs text-muted-foreground truncate">
                {targetName}まで約{formatDistance(nearest.distance)}
              </span>
            )}
            <span className="ml-auto shrink-0">
              <CongestionBadge congestion={nearest.bus.congestion} />
            </span>
          </>
        ) : (
          <SourceNote />
        )}
      </div>

      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 space-y-3 shrink-0">
              <DialogTitle>バスの現在地</DialogTitle>
              {routeHeader}
              <DialogDescription>{statusText}</DialogDescription>
            </DialogHeader>
            <div className="grid min-h-0 flex-1 border-t md:grid-cols-[1fr_280px]">
              <div className="relative h-[50vh] md:h-[60vh]">
                {isOpen && (
                  <BusMap
                    buses={buses}
                    routePath={currentPath}
                    stops={stops}
                    interactive
                    className="absolute inset-0"
                  />
                )}
              </div>
              <div className="flex min-h-0 flex-col border-t md:border-t-0 md:border-l">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <BusList items={items} targetName={targetName} />
                </div>
                <SourceNote className="border-t px-4 py-2" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>バスの現在地</DrawerTitle>
              <DrawerDescription className="sr-only">
                選択中の出発地と行先を走っているバスの現在地を表示します
              </DrawerDescription>
              {routeHeader}
            </DrawerHeader>
            {/* 地図の上ではドロワーをドラッグで閉じないようにする */}
            <div className="relative h-[42vh] shrink-0 border-y" data-vaul-no-drag>
              {isOpen && (
                <BusMap
                  buses={buses}
                  routePath={currentPath}
                  stops={stops}
                  interactive
                  className="absolute inset-0"
                />
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <BusList items={items} targetName={targetName} />
              <SourceNote className="px-4 pb-2" />
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="default" className="p-5 font-bold">
                  閉じる
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
