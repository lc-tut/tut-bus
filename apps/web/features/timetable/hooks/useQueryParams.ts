'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { z } from 'zod'
import type { TimeFilterType } from '@/lib/types/timetable'

const QuerySchema = z.object({
  from: z.coerce.number().int().optional(),
  to: z.coerce.number().int().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  filter: z.enum(['all', 'preDeparture', 'departure', 'arrival']).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
})

export const useTimetableQuery = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  // state
  const [from, setFrom] = useState<number | null>(null)
  const [to, setTo] = useState<number | null>(null)
  const [date, setDate] = useState<Date | null>(null)
  const [filter, setFilter] = useState<TimeFilterType>('all')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('10:00')

  // ---  URL → State  ----------------------
  useEffect(() => {
    const raw = Object.fromEntries(searchParams.entries())
    const aliased = {
      ...raw,
      from: raw.from ?? raw.departure,
      to: raw.to ?? raw.destination,
      filter: raw.filter ?? raw.timeFilter,
    }
    const parsed = QuerySchema.safeParse(aliased)
    if (!parsed.success) return
    const { from, to, date, filter, startTime, endTime } = parsed.data
    if (from !== undefined) setFrom(from)
    if (to !== undefined) setTo(to)
    if (date) setDate(parseISO(date))
    if (filter) setFilter(filter)
    if (filter === 'departure' && startTime) setStartTime(startTime)
    if (filter === 'arrival' && endTime) setEndTime(endTime)
    if (!date) setDate(new Date())
  }, [searchParams])

  // ---  State → URL  ----------------------
  useEffect(() => {
    if (!date) return
    const p = new URLSearchParams()
    if (from !== null) p.set('from', String(from))
    if (to !== null) p.set('to', String(to))
    p.set('date', format(date, 'yyyy-MM-dd'))
    if (filter !== 'all') p.set('filter', filter)
    if (filter === 'departure') p.set('startTime', startTime)
    if (filter === 'arrival') p.set('endTime', endTime)
    router.replace(`/timetable?${p.toString()}`, { scroll: false })
  }, [from, to, date, filter, startTime, endTime, router])

  // swap helper
  const swapStations = useCallback(() => {
    if (from == null || to == null || from === to) return
    setFrom(to)
    setTo(from)
  }, [from, to])

  return {
    from,
    setFrom,
    to,
    setTo,
    date,
    setDate,
    filter,
    setFilter,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    swapStations,
  }
}
