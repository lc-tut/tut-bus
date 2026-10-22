'use client'

import type { BusMapFocus } from '@/components/bus-location/bus-map'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { components } from '@/generated/oas'
import {
  BUS_LOCATION_ROUTES,
  BusLocationDirection,
  BusLocationSlug,
  getBusLocationRoute,
  resolveBusLocationRoute,
} from '@/lib/bus-location'
import { BusLocationView, formatAge } from '@/lib/bus-location-view'
import { useBusLocationView } from '@/lib/hooks/use-bus-location-view'
import { useInView } from '@/lib/hooks/use-in-view'
import { useUserLocation } from '@/lib/hooks/use-user-location'
import { cn } from '@/lib/utils'
import { busLocationSelectionAtom } from '@/store'
import { useAtom } from 'jotai'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { FaArrowRight, FaCrosshairs, FaListUl, FaLocationArrow } from 'react-icons/fa'
import { BusList, getStatusText, LiveDot, MapLegend, NextBusSummary, SourceNote } from './parts'

const BusMap = dynamic(() => import('@/components/bus-location/bus-map'), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 rounded-none" />,
})

type BusStopGroup = components['schemas']['Models.BusStopGroup']

const tabsTriggerClassName =
  'px-2 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:font-semibold dark:data-[state=active]:shadow-sm'

function groupNameOf(stopId: number | undefined, busStopGroups: BusStopGroup[]) {
  return busStopGroups.find((g) => g.busStops.some((s) => s.id === stopId))?.name
}

// 運行台数と更新時刻（0台のときの文言は地図の下に出すので、ここでは出さない）
function BusCountStatus({
  loaded,
  error,
  count,
  latestAgeSeconds,
  className,
}: {
  loaded: boolean
  error: boolean
  count: number
  latestAgeSeconds: number | null
  className?: string
}) {
  const statusText =
    count > 0 ? `${count}台が運行中` : !loaded || error ? getStatusText(loaded, error, count) : null
  if (!statusText) return null
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <LiveDot active={count > 0} />
      <span className="font-semibold">{statusText}</span>
      {count > 0 && latestAgeSeconds !== null && (
        <span className="text-[10px] text-muted-foreground">
          {formatAge(latestAgeSeconds)}に更新
        </span>
      )}
    </div>
  )
}

// 「一覧」ボタンと、運行中のバスを並べたダイアログ
function BusListDialog({
  view,
  loaded,
  error,
}: {
  view: BusLocationView | null
  loaded: boolean
  error: boolean
}) {
  const count = view?.mapBuses.length ?? 0
  const originName = view?.origin?.name ?? ''
  const targetName = view?.target?.name ?? ''

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) (document.activeElement as HTMLElement)?.blur()
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="h-8 shrink-0">
          <FaListUl className="size-3" />
          一覧
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 text-left">
          <DialogTitle>運行中のバス</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            {originName}
            <FaArrowRight className="size-2.5" />
            {targetName}
          </DialogDescription>
          <BusCountStatus
            loaded={loaded}
            error={error}
            count={count}
            latestAgeSeconds={view?.latestAgeSeconds ?? null}
          />
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto border-t">
          {view && (
            <BusList
              approaching={view.approaching}
              departed={view.departed}
              originName={originName}
              targetName={targetName}
            />
          )}
        </div>
        <SourceNote className="border-t px-5 py-2" />
      </DialogContent>
    </Dialog>
  )
}

// 地図の下の「次に来るバス」と「一覧」ボタンの行
function MapFooter({
  view,
  loaded,
  error,
}: {
  view: BusLocationView | null
  loaded: boolean
  error: boolean
}) {
  const count = view?.mapBuses.length ?? 0
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-t min-h-[52px]">
      {loaded && view && !(error && count === 0) ? (
        <NextBusSummary nextBus={view.nextBus} hasAnyBus={count > 0} />
      ) : (
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {getStatusText(loaded, error, count)}
        </span>
      )}
      <BusListDialog view={view} loaded={loaded} error={error} />
    </div>
  )
}

/**
 * PC: 右側の aside の一番上に置く地図。路線と向きを切り替えられる
 */
export function DesktopBusLocationMapCard({ busStopGroups }: { busStopGroups: BusStopGroup[] }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const [selection, setSelection] = useAtom(busLocationSelectionAtom)
  const route = useMemo(
    () => getBusLocationRoute(selection.slug, selection.direction),
    [selection.slug, selection.direction]
  )
  const { view, loaded, error, routePath } = useBusLocationView(route, busStopGroups, {
    enabled: inView,
    withRoutePath: true,
  })

  const def = BUS_LOCATION_ROUTES.find((d) => d.slug === selection.slug)
  const station = groupNameOf(def?.stationStopId, busStopGroups) ?? ''
  const campus = groupNameOf(def?.campusStopId, busStopGroups) ?? '大学'
  const count = view?.mapBuses.length ?? 0

  return (
    <Card ref={ref} className="w-full overflow-hidden border-muted py-0 gap-0 block border">
      <div className="space-y-2 px-3 py-3 border-b bg-muted/40">
        <Tabs
          value={selection.slug}
          onValueChange={(slug) => setSelection({ ...selection, slug: slug as BusLocationSlug })}
        >
          <TabsList className="grid w-full grid-cols-3 bg-muted dark:bg-muted/80 p-1 h-auto border rounded-md">
            {BUS_LOCATION_ROUTES.map((d) => (
              <TabsTrigger key={d.slug} value={d.slug} className={tabsTriggerClassName}>
                <span className="truncate">{groupNameOf(d.stationStopId, busStopGroups)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs
          value={selection.direction}
          onValueChange={(direction) =>
            setSelection({ ...selection, direction: direction as BusLocationDirection })
          }
        >
          <TabsList className="grid w-full grid-cols-2 bg-muted dark:bg-muted/80 p-1 h-auto border rounded-md">
            <TabsTrigger value="reverse" className={tabsTriggerClassName}>
              <span className="truncate">{station}</span>
              <FaArrowRight className="size-2.5 shrink-0" />
              <span className="shrink-0">{campus}</span>
            </TabsTrigger>
            <TabsTrigger value="forward" className={tabsTriggerClassName}>
              <span className="shrink-0">{campus}</span>
              <FaArrowRight className="size-2.5 shrink-0" />
              <span className="truncate">{station}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative h-72 xl:h-80">
        {inView && view ? (
          <BusMap
            buses={view.mapBuses}
            routePath={routePath}
            stops={view.stops}
            className="absolute inset-0"
          />
        ) : (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}
        <BusCountStatus
          loaded={loaded}
          error={error}
          count={count}
          latestAgeSeconds={view?.latestAgeSeconds ?? null}
          className="pointer-events-none absolute top-2 left-2 rounded-md border bg-background/90 px-2 py-1 shadow-sm"
        />
        <MapLegend className="pointer-events-none absolute right-2 bottom-2" />
      </div>

      <MapFooter view={view} loaded={loaded} error={error} />
    </Card>
  )
}

/**
 * スマホ: カルーセルの上に置く地図。表示中のカードの出発地・行先に合わせて、
 * 次に来るバスと出発地（と自分の現在地）が入るように追いかける
 */
export function MobileBusLocationMapCard({
  departureGroup,
  destinationStopId,
  busStopGroups,
}: {
  departureGroup: BusStopGroup | null
  destinationStopId: number | null
  busStopGroups: BusStopGroup[]
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const [following, setFollowing] = useState(true)
  const [showMyLocation, setShowMyLocation] = useState(false)
  const { location: userLocation, status: locationStatus } = useUserLocation(showMyLocation)

  const route = useMemo(
    () =>
      departureGroup
        ? resolveBusLocationRoute(
            departureGroup.busStops.map((stop) => stop.id),
            destinationStopId
          )
        : null,
    [departureGroup, destinationStopId]
  )
  const routeKey = route ? `${route.slug}:${route.direction}` : 'none'
  const { view, loaded, error, routePath } = useBusLocationView(route, busStopGroups, {
    enabled: inView,
    withRoutePath: true,
  })

  // 次に来るバス・出発地・自分の現在地が入る範囲を追いかける
  // 50m 程度動いたときだけ合わせ直す（小さな揺れで地図が動き続けないように）
  const focus = useMemo<BusMapFocus | null>(() => {
    if (!following || !view?.origin) return null
    const points: [number, number][] = [[view.origin.lng, view.origin.lat]]
    if (view.nextBus) points.push([view.nextBus.bus.lon, view.nextBus.bus.lat])
    if (userLocation) points.push([userLocation.lng, userLocation.lat])
    if (points.length === 1 && view.target) points.push([view.target.lng, view.target.lat])
    const key = [routeKey, ...points.map(([lng, lat]) => `${lng.toFixed(3)},${lat.toFixed(3)}`)]
    return { key: key.join('|'), points }
  }, [following, view, userLocation, routeKey])

  if (!route) return null

  return (
    // ヘッダーのすぐ下に画面幅いっぱいで敷くので、カードの枠や角丸は付けない
    <div ref={ref} className="w-full overflow-hidden border-b bg-card">
      <div className="relative h-56">
        {inView && view ? (
          <BusMap
            buses={view.mapBuses}
            routePath={routePath}
            stops={view.stops}
            userLocation={userLocation}
            focus={focus}
            cooperativeGestures
            onUserMove={() => setFollowing(false)}
            className="absolute inset-0"
          />
        ) : (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}

        {showMyLocation && (locationStatus === 'denied' || locationStatus === 'unavailable') && (
          <p className="pointer-events-none absolute top-2 left-2 rounded-md border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground shadow-sm">
            {locationStatus === 'denied'
              ? '位置情報の利用が許可されていません'
              : '現在地を取得できませんでした'}
          </p>
        )}

        <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              'h-8 bg-background/90 shadow-sm',
              showMyLocation && 'text-sky-600 dark:text-sky-400'
            )}
            onClick={() => {
              setShowMyLocation((prev) => !prev)
              setFollowing(true)
            }}
            aria-pressed={showMyLocation}
          >
            <FaLocationArrow className="size-3" />
            自分
          </Button>
          {!following && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 bg-background/90 shadow-sm"
              onClick={() => setFollowing(true)}
            >
              <FaCrosshairs className="size-3" />
              追従
            </Button>
          )}
        </div>

        <MapLegend className="pointer-events-none absolute right-2 bottom-2" />
      </div>

      <MapFooter view={view} loaded={loaded} error={error} />
    </div>
  )
}
