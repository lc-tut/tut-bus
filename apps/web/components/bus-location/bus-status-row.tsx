'use client'

import { components } from '@/generated/oas'
import { distanceMeters, resolveBusLocationRoute } from '@/lib/bus-location'
import { formatDistance } from '@/lib/bus-location-view'
import { useBusLocationView } from '@/lib/hooks/use-bus-location-view'
import { useInView } from '@/lib/hooks/use-in-view'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { FaBus } from 'react-icons/fa'
import { CongestionBadge, getStatusText, LiveDot } from './parts'

type BusStopGroup = components['schemas']['Models.BusStopGroup']

// この距離より近ければ「まもなく到着」とする
const ARRIVING_METERS = 150

interface BusStatusRowProps {
  departureGroup: BusStopGroup
  destinationStopId: number | null
  busStopGroups: BusStopGroup[]
}

/**
 * 反対側のバス停から出発地へ向かってくるバスの位置を、1本の線で表す
 * progress: 0 = 反対側のバス停、1 = 出発地（null のときはバスなし）
 */
function ApproachTrack({
  progress,
  fromName,
  toName,
}: {
  progress: number | null
  fromName: string
  toName: string
}) {
  const active = progress !== null
  // 線の両端（%）。端の丸が切れないよう少し内側にする
  const start = 2
  const end = 98
  const busX = active ? start + (end - start) * progress : null

  return (
    <div>
      <svg width="100%" height="20" className="block overflow-visible" aria-hidden>
        {/* 路線 */}
        <line
          x1={`${start}%`}
          x2={`${end}%`}
          y1="10"
          y2="10"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
          className="stroke-muted-foreground/30"
        />
        {/* バスから出発地までの残り */}
        {busX !== null && (
          <line
            x1={`${busX}%`}
            x2={`${end}%`}
            y1="10"
            y2="10"
            strokeWidth="3"
            strokeLinecap="round"
            className="stroke-orange-500"
          />
        )}
        {/* 反対側のバス停 */}
        <circle cx={`${start}%`} cy="10" r="3.5" className="fill-muted-foreground/40" />
        {/* 出発地 */}
        <circle
          cx={`${end}%`}
          cy="10"
          r="5"
          strokeWidth="2"
          className={cn('stroke-background', active ? 'fill-blue-500' : 'fill-muted-foreground/40')}
        />
        {/* バス */}
        {busX !== null && (
          <svg x={`${busX}%`} y="10" overflow="visible">
            <circle r="9" strokeWidth="2" className="fill-orange-500 stroke-background" />
            <FaBus x={-5} y={-5} width={10} height={10} className="fill-white" />
          </svg>
        )}
      </svg>
      <div className="mt-0.5 flex justify-between text-[10px] leading-3 text-muted-foreground">
        <span className="truncate">{fromName}方面</span>
        <span className={cn('truncate', active && 'font-medium text-blue-600 dark:text-blue-400')}>
          {toName}
        </span>
      </div>
    </div>
  )
}

/**
 * PC の時刻表カードに出す、出発地に一番近い接近中のバスがあとどのくらいか
 * どの状態でも同じ高さにして、カードの高さが変わらないようにする
 */
export function BusStatusRow({
  departureGroup,
  destinationStopId,
  busStopGroups,
}: BusStatusRowProps) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const route = useMemo(
    () =>
      resolveBusLocationRoute(
        departureGroup.busStops.map((stop) => stop.id),
        destinationStopId
      ),
    [departureGroup, destinationStopId]
  )
  const { view, loaded, error } = useBusLocationView(route, busStopGroups, {
    enabled: inView,
    withRoutePath: false,
  })

  if (!route) return null

  const origin = view?.origin ?? null
  const target = view?.target ?? null
  const count = view?.mapBuses.length ?? 0
  const nextBus = loaded ? (view?.nextBus ?? null) : null

  // 反対側のバス停から出発地までの直線距離に対する、バスの進み具合
  let progress: number | null = null
  if (nextBus && nextBus.distance !== null && origin && target) {
    const total = distanceMeters(target.lat, target.lng, origin.lat, origin.lng)
    progress = total > 0 ? Math.min(1, Math.max(0, 1 - nextBus.distance / total)) : 1
  }

  const emptyText =
    loaded && !error && count > 0
      ? '接近中のバスは確認されていません'
      : getStatusText(loaded, error, count)

  return (
    // スマホではヘッダー下の地図に同じ情報があるので出さない（非表示のあいだは取得もしない）
    <div ref={ref} className="hidden sm:block border-b px-4 pt-2.5 pb-2">
      <div className="flex h-6 items-center gap-2">
        {nextBus ? (
          <>
            <span className="text-sm font-semibold shrink-0">{nextBus.bus.name}</span>
            {nextBus.distance !== null && nextBus.distance < ARRIVING_METERS ? (
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                まもなく到着
              </span>
            ) : (
              // 出発地の名前は線の右端に出しているので、ここでは距離だけを出す（長い駅名で距離が切れないように）
              nextBus.distance !== null && (
                <span className="shrink-0 text-sm font-bold text-orange-600 dark:text-orange-400">
                  あと約{formatDistance(nextBus.distance)}
                </span>
              )
            )}
            <span className="ml-auto shrink-0">
              <CongestionBadge congestion={nextBus.bus.congestion} />
            </span>
          </>
        ) : (
          <>
            <LiveDot active={false} />
            <span className="min-w-0 truncate text-sm text-muted-foreground">{emptyText}</span>
          </>
        )}
      </div>
      <div className="mt-1.5">
        <ApproachTrack
          progress={progress}
          fromName={target?.name ?? ''}
          toName={origin?.name ?? departureGroup.name}
        />
      </div>
    </div>
  )
}
