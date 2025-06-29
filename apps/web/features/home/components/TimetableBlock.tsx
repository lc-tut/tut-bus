'use client'
import { TimetableDisplay } from '@/components/home/timetable-display'
import type { components } from '@/generated/oas'
import type { DisplayBusInfo } from '@/lib/types/timetable'
import { FaBan } from 'react-icons/fa'

interface TimetableBlockProps {
  timetable?: {
    filtered: DisplayBusInfo[]
    allBuses: DisplayBusInfo[]
    raw: components['schemas']['Models.BusStopGroupTimetable']
  }
  now: Date | null
  busStopGroups: components['schemas']['Models.BusStopGroup'][]
  destinationId: number | null
  departureId: number
}

export const TimetableBlock = ({
  timetable,
  now,
  busStopGroups,
  destinationId,
  departureId,
}: TimetableBlockProps) => {
  // TODO:
  if (!timetable) return <h1>Loading</h1>

  const hasDestinations =
    timetable.allBuses?.some((b) => b.destination.stopId) ||
    timetable.raw?.segments?.some((s) => s.destination?.stopId)

  if (!hasDestinations || timetable.filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FaBan className="h-8 w-8 text-orange-500" />
        </div>
        <h3 className="mt-2 text-base font-medium">
          {hasDestinations
            ? '選択された時刻・目的地のバスはありません'
            : '本日の運行予定はありません'}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground max-w-xs">
          {hasDestinations
            ? '別の目的地を選択するか、しばらく時間をおいてからご確認ください'
            : '必ずしも正しいとは限らないため、公式サイトの運行スケジュールをご確認ください'}
        </p>
      </div>
    )
  }

  return (
    <TimetableDisplay
      selectedDeparture={departureId}
      selectedDestination={destinationId}
      filteredTimetable={timetable.filtered}
      now={now}
      busStopGroups={busStopGroups}
    />
  )
}
