'use client'

import { filterBusesByDeparture, filterBusesByDestination } from '@/features/timetable/utils'
import type { components } from '@/generated/oas'
import { useNow } from '@/hooks/common/useNow'
import { useGroupTimetable } from '@/hooks/timetable/useGroupTimetable'
import { useEffect, useMemo, useState } from 'react'
import { useBusStopGroups } from '../../../hooks/busStops/useBusStopGroups'
import { extractDestinations } from '../utils'
import { DepartureCard } from './DepartureCard'
import { DestinationSelector } from './DestinationSelector'
import { TimetableBlock } from './TimetableBlock'

type Group = components['schemas']['Models.BusStopGroup']

interface Props {
  group: Group
  date: Date
}

export const GroupTimetable = ({ group, date }: Props) => {
  const { timetable, isLoading, error } = useGroupTimetable(group, date)
  const now = useNow(15_000)

  const [destId, setDestId] = useState<number | null>(null)

  const destinations = useMemo(() => extractDestinations(timetable), [timetable])
  const { busStopGroups: groups } = useBusStopGroups()

  const filteredTimetable = useMemo(() => {
    if (!timetable || !now) return timetable

    const destinationFilteredBuses = filterBusesByDestination(timetable.allBuses, destId)
    const finalFilteredBuses = filterBusesByDeparture(destinationFilteredBuses, now)

    return {
      ...timetable,
      filtered: finalFilteredBuses,
    }
  }, [timetable, now, destId])

  useEffect(() => {
    console.debug('GroupTimetable: Filtering buses by destination:', destId)
    console.debug('Destinations:', destinations)
    if (destId == null && destinations.length > 0) {
      console.debug('Setting default destination ID:', destinations[0].stopId)
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
        timetable={filteredTimetable}
        now={now}
        busStopGroups={groups}
        destinationId={destId}
        departureId={group.id}
      />
    </DepartureCard>
  )
}
