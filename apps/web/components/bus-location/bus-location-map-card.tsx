'use client'

import type { BusMapFocus } from '@/components/bus-location/bus-map'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
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
import { formatAge } from '@/lib/bus-location-view'
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

function stationName(slug: BusLocationSlug, busStopGroups: BusStopGroup[]) {
  const def = BUS_LOCATION_ROUTES.find((route) => route.slug === slug)
  return (
    busStopGroups.find((g) => g.busStops.some((s) => s.id === def?.stationStopId))?.name ?? slug
  )
}

// 見出しの右側には台数だけ出す（0台のときの文言は地図の下や一覧に出す）
function CardHeaderRow({
  title,
  loaded,
  error,
  count,
  latestAgeSeconds,
}: {
  title: string
  loaded: boolean
  error: boolean
  count: number
  latestAgeSeconds: number | null
}) {
  const statusText =
    count > 0 ? `${count}台が運行中` : !loaded || error ? getStatusText(loaded, error, count) : null
  return (
    <div className="bg-blue-100/60 dark:bg-blue-950/60 px-4 py-3 min-h-[56px] flex items-center gap-3">
      <h2 className="min-w-0 flex-1 text-base font-bold truncate">{title}</h2>
      {statusText && (
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold flex items-center justify-end gap-1.5">
            <LiveDot active={count > 0} />
            {statusText}
          </div>
          {latestAgeSeconds !== null && (
            <div className="text-[10px] text-muted-foreground">
              {formatAge(latestAgeSeconds)}に更新
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * PC: カード一覧の上に置く大きな地図。路線と向きを切り替えられる
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

  const station = stationName(selection.slug, busStopGroups)
  const campusStopId = BUS_LOCATION_ROUTES.find((def) => def.slug === selection.slug)?.campusStopId
  const campusName =
    busStopGroups.find((g) => g.busStops.some((s) => s.id === campusStopId))?.name ?? '大学'
  const originName = view?.origin?.name ?? ''
  const targetName = view?.target?.name ?? ''
  const count = view?.mapBuses.length ?? 0

  return (
    <Card ref={ref} className="w-full overflow-hidden border-muted py-0 gap-0 block border">
      <CardHeaderRow
        title="バスの現在地"
        loaded={loaded}
        error={error}
        count={count}
        latestAgeSeconds={view?.latestAgeSeconds ?? null}
      />

      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-muted/40">
        <Tabs
          value={selection.slug}
          onValueChange={(slug) => setSelection({ ...selection, slug: slug as BusLocationSlug })}
        >
          <TabsList className="bg-muted dark:bg-muted/80 p-1 h-auto border rounded-md">
            {BUS_LOCATION_ROUTES.map((def) => (
              <TabsTrigger
                key={def.slug}
                value={def.slug}
                className="px-3 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:font-semibold dark:data-[state=active]:shadow-sm"
              >
                {stationName(def.slug, busStopGroups)}
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
          <TabsList className="bg-muted dark:bg-muted/80 p-1 h-auto border rounded-md">
            <TabsTrigger
              value="reverse"
              className="px-3 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:font-semibold dark:data-[state=active]:shadow-sm"
            >
              {station}
              <FaArrowRight className="mx-1 size-2.5" />
              {campusName}
            </TabsTrigger>
            <TabsTrigger
              value="forward"
              className="px-3 py-1.5 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:font-semibold dark:data-[state=active]:shadow-sm"
            >
              {campusName}
              <FaArrowRight className="mx-1 size-2.5" />
              {station}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <MapLegend className="ml-auto" />
      </div>

      <div className="grid lg:grid-cols-[1fr_300px]">
        <div className="relative h-[320px] lg:h-[400px]">
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
        </div>
        <div className="flex flex-col border-t lg:border-t-0 lg:border-l max-h-[320px] lg:max-h-[400px]">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view && (
              <BusList
                approaching={view.approaching}
                departed={view.departed}
                originName={originName}
                targetName={targetName}
              />
            )}
          </div>
          <SourceNote className="border-t px-4 py-2" />
        </div>
      </div>
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

  const originName = view?.origin?.name ?? departureGroup?.name ?? ''
  const targetName = view?.target?.name ?? ''
  const count = view?.mapBuses.length ?? 0

  return (
    <Card ref={ref} className="w-full overflow-hidden border-muted py-0 gap-0 block border">
      <CardHeaderRow
        title="バスの現在地"
        loaded={loaded}
        error={error}
        count={count}
        latestAgeSeconds={view?.latestAgeSeconds ?? null}
      />

      <div className="relative h-48">
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

        <div className="absolute top-2 right-2 flex flex-col gap-2">
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
        {showMyLocation && (locationStatus === 'denied' || locationStatus === 'unavailable') && (
          <p className="absolute left-2 top-2 rounded-md border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground shadow-sm">
            {locationStatus === 'denied'
              ? '位置情報の利用が許可されていません'
              : '現在地を取得できませんでした'}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 border-t min-h-[44px]">
        {loaded && view ? (
          <NextBusSummary nextBus={view.nextBus} hasAnyBus={count > 0} originName={originName} />
        ) : (
          <span className="text-xs text-muted-foreground">位置情報を取得中...</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-3">
        <MapLegend />
        <Drawer
          onOpenChange={(open) => {
            if (open) (document.activeElement as HTMLElement)?.blur()
          }}
        >
          <DrawerTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="h-8">
              <FaListUl className="size-3" />
              一覧
            </Button>
          </DrawerTrigger>
          <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[80vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>運行中のバス</DrawerTitle>
              <DrawerDescription>
                {originName} → {targetName}
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto border-t">
              {view && (
                <BusList
                  approaching={view.approaching}
                  departed={view.departed}
                  originName={originName}
                  targetName={targetName}
                />
              )}
              <SourceNote className="px-4 py-2" />
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
      </div>
    </Card>
  )
}
