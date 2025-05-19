'use client'

import { TimetableDisplay } from '@/components/timetable/timetable-display'
import { TimetableFilter } from '@/components/timetable/timetable-filter'
import { TimeFilterType } from '@/lib/types/timetable'
import { canSwapStations, filterTimetable } from '@/lib/utils/timetable'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function TimetablePage() {
  // 状態管理
  const [selectedDeparture, setSelectedDeparture] = useState<string>('')
  const [selectedDestination, setSelectedDestination] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all')
  const [startTime, setStartTime] = useState<string>('10:00')
  const [endTime, setEndTime] = useState<string>('10:00')

  // クライアントサイドでのみ実行される初期化
  useEffect(() => {
    const currentDate = new Date()
    setSelectedDate(currentDate)
    setNow(currentDate)

    // 1分ごとに現在時刻を更新
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => clearInterval(intervalId)
  }, [])

  // 出発地と目的地を入れ替える
  const swapStations = useCallback(() => {
    if (!selectedDeparture || !selectedDestination) return
    if (
      selectedDeparture === selectedDestination ||
      !canSwapStations(selectedDestination, selectedDeparture)
    )
      return
    setSelectedDeparture(selectedDestination)
    setSelectedDestination(selectedDeparture)
  }, [selectedDeparture, selectedDestination])

  // フィルタリングされた時刻表データ
  const filteredTimetable = useMemo(() => {
    return filterTimetable(
      selectedDeparture,
      selectedDestination,
      timeFilter,
      startTime,
      endTime,
      selectedDate,
      now
    )
  }, [selectedDeparture, selectedDestination, timeFilter, startTime, endTime, selectedDate, now])

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 max-w-none xl:w-full">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        <div>
          <TimetableFilter
            selectedDeparture={selectedDeparture}
            setSelectedDeparture={setSelectedDeparture}
            selectedDestination={selectedDestination}
            setSelectedDestination={setSelectedDestination}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            now={now}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            swapStations={swapStations}
          />
        </div>

        <TimetableDisplay
          selectedDeparture={selectedDeparture}
          selectedDestination={selectedDestination}
          filteredTimetable={filteredTimetable}
          now={now}
        />
      </div>
    </div>
  )
}
