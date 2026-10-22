'use client'

import { Badge } from '@/components/ui/badge'
import { BusCongestion, congestionLabels } from '@/lib/bus-location'
import { BusListItem, formatAge, formatDistance } from '@/lib/bus-location-view'
import { cn } from '@/lib/utils'
import { FaBus } from 'react-icons/fa'

const congestionClassNames: Record<BusCongestion, string> = {
  low: 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300',
  medium:
    'bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-300',
  high: 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-800 dark:text-red-300',
}

// active が false（バスが見つからない）のときは点滅させず灰色にする
export function LiveDot({ active = true }: { active?: boolean }) {
  return (
    <span className="relative flex size-2">
      {active && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
      )}
      <span
        className={cn(
          'relative inline-flex size-2 rounded-full',
          active ? 'bg-blue-500' : 'bg-muted-foreground/50'
        )}
      />
    </span>
  )
}

export function CongestionBadge({ congestion }: { congestion: BusCongestion | null }) {
  if (!congestion) return null
  return (
    <Badge variant="outline" className={cn('text-[10px]', congestionClassNames[congestion])}>
      {congestionLabels[congestion]}
    </Badge>
  )
}

// 地図の上に重ねる色の説明
export function MapLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-md border bg-background/90 px-2 py-1 text-[10px] font-medium shadow-sm',
        className
      )}
    >
      <span className="flex items-center gap-1">
        <span className="size-2.5 rounded-full bg-orange-500" />
        接近中
      </span>
      <span className="flex items-center gap-1 text-muted-foreground">
        <span className="size-2 rounded-full bg-slate-400 dark:bg-slate-500" />
        出発済み
      </span>
    </div>
  )
}

export function SourceNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-[10px] text-muted-foreground', className)}>
      位置情報: 片柳学園（イマロケ）・距離は直線距離です
    </p>
  )
}

export function getStatusText(loaded: boolean, error: boolean, count: number) {
  if (!loaded) return '位置情報を取得中...'
  if (error && count === 0) return '位置情報を取得できませんでした'
  if (count === 0) return '運行中のバスは確認されていません'
  return `${count}台が運行中`
}

function BusListSection({
  title,
  items,
  stopName,
}: {
  title: string
  items: BusListItem[]
  stopName: string
}) {
  if (items.length === 0) return null
  return (
    <section>
      <h3 className="bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {title}（{items.length}台）
      </h3>
      <ul className="divide-y">
        {items.map(({ bus, distance, ageSeconds }) => (
          <li
            key={bus.bus_id}
            className={cn('flex items-center gap-3 px-3 py-2.5', bus.stale && 'opacity-50')}
          >
            <div
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-white',
                bus.variant === 'approaching' ? 'bg-orange-500' : 'bg-slate-400 dark:bg-slate-500'
              )}
            >
              <FaBus className="size-3" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{bus.name}</div>
              {distance !== null && (
                <div className="text-xs text-muted-foreground truncate">
                  {stopName}まで約{formatDistance(distance)}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <CongestionBadge congestion={bus.congestion} />
              {ageSeconds !== null && (
                <span className="text-[10px] text-muted-foreground">{formatAge(ageSeconds)}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function BusList({
  approaching,
  departed,
  originName,
  targetName,
}: {
  approaching: BusListItem[]
  departed: BusListItem[]
  originName: string
  targetName: string
}) {
  if (approaching.length === 0 && departed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-5 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <FaBus className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">運行中のバスは確認されていません</p>
      </div>
    )
  }
  return (
    <>
      <BusListSection title="接近中のバス" items={approaching} stopName={originName} />
      <BusListSection title="出発済みのバス" items={departed} stopName={targetName} />
    </>
  )
}

// 次に来るバス（出発地に一番近い、接近中のバス）の1行表示
export function NextBusSummary({
  nextBus,
  hasAnyBus,
}: {
  nextBus: BusListItem | null
  hasAnyBus: boolean
}) {
  if (!nextBus) {
    return (
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {hasAnyBus ? '接近中のバスは確認されていません' : '運行中のバスは確認されていません'}
      </span>
    )
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {/* 地図の「接近中」と同じオレンジで、どのバスのことか分かるようにする */}
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
        <FaBus className="size-2.5" />
      </span>
      <span className="text-sm font-semibold shrink-0">{nextBus.bus.name}</span>
      {nextBus.distance !== null && (
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          あと約{formatDistance(nextBus.distance)}
        </span>
      )}
      <span className="ml-auto shrink-0">
        <CongestionBadge congestion={nextBus.bus.congestion} />
      </span>
    </div>
  )
}
