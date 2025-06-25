'use client'

import { useState, useMemo, useEffect } from 'react'
import type { components } from '@/generated/oas'
import { useGroupTimetable } from '@/features/home/hooks/useGroupTimetable'
import { extractDestinations } from '../utils'
import { DestinationSelector } from './DestinationSelector'
import { TimetableBlock } from './TimetableBlock'
import { DepartureCard } from './DepartureCard'
import { useNow } from '@/hooks/common/useNow'

type Group = components['schemas']['Models.BusStopGroup']

interface Props {
  group: Group
  date: Date
}
export const GroupTimetable = ({ group, date }: Props) => {
  const { timetable, isLoading, error } = useGroupTimetable(group, date)
  const now = useNow(15_000)

  /* 行き先セレクト状態（このグループだけ） */
  const [destId, setDestId] = useState<number | null>(null)

  const destinations = useMemo(() => extractDestinations(timetable), [timetable])

  useEffect(() => {
    if (destId == null && destinations.length === 1) {
      setDestId(destinations[0].stopId)
    }
  }, [destId, destinations])

  if (isLoading)
    return (
      <DepartureCard title={group.name}>
        <div className="py-6 text-center">読み込み中...</div>
      </DepartureCard>
    )
  if (error || !timetable)
    return (
      <DepartureCard title={group.name}>
        <div className="py-6 text-center text-red-500">取得失敗</div>
      </DepartureCard>
    )

  return (
    <DepartureCard title={group.name}>
      <DestinationSelector destinations={destinations} value={destId} onChange={setDestId} />
      <TimetableBlock
        timetable={timetable}
        now={now}
        busStopGroups={[group]}
        destinationId={destId}
        departureId={group.id}
      />
    </DepartureCard>
  )
}
