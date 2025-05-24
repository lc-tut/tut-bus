'use client'

import { TimetableDisplay } from '@/components/timetable/timetable-display'
import { TimetableFilter } from '@/components/timetable/timetable-filter'
import { client } from '@/lib/client' // clientをインポート
import { TimeFilterType } from '@/lib/types/timetable'
import { canSwapStations, filterTimetable } from '@/lib/utils/timetable'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { operations, components } from '@/generated/oas' // operations をインポートリストに追加 (既に存在する場合あり)
import { format } from 'date-fns' // date-fns から format をインポート

export default function TimetablePage() {
  // 状態管理
  const [selectedDeparture, setSelectedDeparture] = useState<number | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all')
  const [startTime, setStartTime] = useState<string>('10:00')
  const [endTime, setEndTime] = useState<string>('10:00')
  // APIからの時刻表データを保持するstate (型を修正)
  const [timetableData, setTimetableData] = useState<
    components['schemas']['Models.BusStopGroupTimetable'] | null
  >(null)

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

  // APIから時刻表データを取得する関数
  const fetchTimetableData = useCallback(async () => {
    if (selectedDeparture == null || !selectedDate) return

    // client.GET の期待する型に合わせて修正
    const paramsForGet: operations['BusStopGroupsService_getBusStopGroupsTimetable']['parameters'] =
      {
        path: {
          id: selectedDeparture,
        },
      }

    if (selectedDate) {
      paramsForGet.query = { date: format(selectedDate, 'yyyy-MM-dd') }
    }

    // client.GET の呼び出しでは、{ params: ... } の形にする
    const { data, error } = await client.GET('/api/bus-stops/groups/{id}/timetable', {
      params: paramsForGet,
    })

    if (error) {
      console.error('Failed to fetch timetable data:', error)
      setTimetableData(null)
      return
    }
    setTimetableData(data)
  }, [selectedDeparture, selectedDate])

  // 出発地、日付が変更されたらAPIからデータを再取得
  useEffect(() => {
    if (selectedDeparture != null && selectedDate) {
      fetchTimetableData()
    }
  }, [selectedDeparture, selectedDate, fetchTimetableData])

  // 出発地と目的地を入れ替える
  const swapStations = useCallback(() => {
    if (!selectedDeparture || !selectedDestination) return
    if (
      selectedDeparture === selectedDestination ||
      !canSwapStations(selectedDestination, selectedDeparture, timetableData) // timetableData を追加
    )
      return
    setSelectedDeparture(selectedDestination)
    setSelectedDestination(selectedDeparture)
  }, [selectedDeparture, selectedDestination, timetableData])

  // フィルタリングされた時刻表データ
  const filteredTimetable = useMemo(() => {
    if (!timetableData || !selectedDate || !now || selectedDeparture == null) return []

    // selectedDestination が null の場合、filterTimetable には undefined を渡すか、
    // もしくは filterTimetable 側で null を許容するように修正する必要がある。
    // ここでは、一旦そのまま null を渡すが、filterTimetable の修正が必要になる可能性を示唆。
    return filterTimetable(
      selectedDeparture!,
      selectedDestination, // null の可能性がある
      timeFilter,
      startTime,
      endTime,
      selectedDate,
      now,
      timetableData // APIから取得した時刻表データ
    )
  }, [
    selectedDeparture,
    selectedDestination, // 依存配列には残す
    timeFilter,
    startTime,
    endTime,
    selectedDate,
    now,
    timetableData,
  ])

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
          timetableData={timetableData}
        />
      </div>
    </div>
  )
}
