'use client'

import type { components } from '@/generated/oas'
import { generateDisplayBuses } from '@/lib/utils/timetable'
import { getGroupTimetable } from '@/service/groupTimetableService'
import { format } from 'date-fns'
import useSWR from 'swr'

type Timetable = components['schemas']['Models.BusStopGroupTimetable']
type Group = components['schemas']['Models.BusStopGroup']

export const useGroupTimetable = (group: Group | null, date: Date | null) => {
  const dateStr = date ? format(date, 'yyyy-MM-dd') : null
  const swrKey = group && dateStr ? ['/timetable', group.id, dateStr] : null

  const {
    data: raw,
    error,
    isLoading,
  } = useSWR<Timetable>(swrKey, () => getGroupTimetable(group!.id, date!), { suspense: false })

  const timetable = raw
    ? (() => {
        const all = generateDisplayBuses([group!], raw, null)
        const filtered = all
        return { filtered, allBuses: all, raw }
      })()
    : undefined

  return { timetable, error, isLoading }
}
