import { useMemo } from 'react'
import { filterTimetable } from '@/lib/utils/timetable'
import type { components } from '@/generated/oas'
import type { TimeFilterType } from '@/lib/types/timetable'

interface Params {
  busStopGroups: components['schemas']['Models.BusStopGroup'][]
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null
  from: number | null
  to: number | null
  filter: TimeFilterType
  startTime: string
  endTime: string
  now: Date | null
}
export const useFilteredTimetable = ({
  busStopGroups,
  timetableData,
  from,
  to,
  filter,
  startTime,
  endTime,
  now,
}: Params) =>
  useMemo(() => {
    if (!timetableData || from == null || !now) return []
    return filterTimetable(busStopGroups, from, to, filter, startTime, endTime, now, timetableData)
  }, [busStopGroups, timetableData, from, to, filter, startTime, endTime, now])
