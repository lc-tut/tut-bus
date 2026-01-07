'use client'

import { TimetableFilter } from '@/components/timetable/timetable-filter'
import type { components, operations } from '@/generated/oas'
import { client } from '@/lib/client'
import { TimeFilterType } from '@/lib/types/timetable'
import { canSwapStations, filterTimetable } from '@/lib/utils/timetable'
import { format, parseISO } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'

export default function TimetablePage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6 space-y-6 px-4">Loading...</div>}>
      <TimetableContent />
    </Suspense>
  )
}

function TimetableContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 状態管理
  const [selectedDepartureGroupId, setSelectedDepartureGroupId] = useState<number | null>(null)
  const [selectedDestinationGroupId, setSelectedDestinationGroupId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all')
  const [startTime, setStartTime] = useState<string>('10:00')
  const [endTime, setEndTime] = useState<string>('10:00')
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(true)
  // APIからの時刻表データを保持するstate (型を修正)
  const [timetableData, setTimetableData] = useState<
    components['schemas']['Models.BusStopGroupTimetable'] | null
  >(null) // URLパラメータを更新する関数
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams()

    if (selectedDepartureGroupId !== null) {
      params.set('from', selectedDepartureGroupId.toString())
    }

    if (selectedDestinationGroupId !== null) {
      params.set('to', selectedDestinationGroupId.toString())
    }

    if (selectedDate !== null) {
      params.set('date', format(selectedDate, 'yyyy-MM-dd'))
    }

    if (timeFilter !== 'all') {
      params.set('filter', timeFilter)
    }

    if (timeFilter === 'departure') {
      params.set('startTime', startTime)
    }

    if (timeFilter === 'arrival') {
      params.set('endTime', endTime)
    }

    // URLを更新（履歴を残さない）
    router.replace(`/timetable?${params.toString()}`, { scroll: false })
  }, [
    selectedDepartureGroupId,
    selectedDestinationGroupId,
    selectedDate,
    timeFilter,
    startTime,
    endTime,
    router,
  ]) // URLパラメータから状態を読み込む
  useEffect(() => {
    // 両方の形式のパラメータ名に対応
    const departureParam = searchParams.get('departure') || searchParams.get('from')
    const destinationParam = searchParams.get('destination') || searchParams.get('to')
    const dateParam = searchParams.get('date')
    const timeFilterParam = (searchParams.get('timeFilter') ||
      searchParams.get('filter')) as TimeFilterType | null
    const startTimeParam = searchParams.get('startTime')
    const endTimeParam = searchParams.get('endTime')

    if (departureParam) {
      setSelectedDepartureGroupId(Number(departureParam))
    }

    if (destinationParam) {
      setSelectedDestinationGroupId(Number(destinationParam))
    }

    if (dateParam) {
      try {
        const parsedDate = parseISO(dateParam)
        if (!isNaN(parsedDate.getTime())) setSelectedDate(parsedDate)
      } catch (e) {
        console.error('Invalid date format in URL', e)
      }
    }

    if (
      timeFilterParam &&
      ['all', 'preDeparture', 'departure', 'arrival'].includes(timeFilterParam)
    ) {
      setTimeFilter(timeFilterParam)
    }

    if (startTimeParam && /^\d{2}:\d{2}$/.test(startTimeParam)) {
      setStartTime(startTimeParam)
    }

    if (endTimeParam && /^\d{2}:\d{2}$/.test(endTimeParam)) {
      setEndTime(endTimeParam)
    }
  }, [searchParams])

  // クライアントサイドでのみ実行される初期化
  useEffect(() => {
    const currentDate = new Date()
    // URLに日付パラメータがない場合のみ、現在の日付を設定
    if (!searchParams.has('date')) {
      setSelectedDate(currentDate)
    }
    setNow(currentDate)

    // 1分ごとに現在時刻を更新
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => clearInterval(intervalId)
  }, [searchParams])

  // 状態が変更されたらURLパラメータを更新
  useEffect(() => {
    if (!selectedDate) return // 初期化前は更新しない
    updateUrlParams()
  }, [
    selectedDepartureGroupId,
    selectedDestinationGroupId,
    selectedDate,
    timeFilter,
    startTime,
    endTime,
    updateUrlParams,
  ])

  // APIから時刻表データを取得する関数
  const fetchTimetableData = useCallback(async () => {
    if (selectedDepartureGroupId == null || !selectedDate) return
    setIsLoadingTimetable(true)
    // client.GET の期待する型に合わせて修正
    const paramsForGet: operations['BusStopGroupsService_getBusStopGroupsTimetable']['parameters'] =
      {
        path: {
          id: selectedDepartureGroupId,
        },
      }
    if (selectedDate) {
      paramsForGet.query = { date: format(selectedDate, 'yyyy-MM-dd') }
    }
    // client.GET の呼び出しでは、{ params: ... } の形にする
    const { data, error } = await client.GET('/api/bus-stops/groups/{id}/timetable', {
      params: paramsForGet,
    })
    setIsLoadingTimetable(false)
    if (error) {
      console.error('Failed to fetch timetable data:', error)
      setTimetableData(null)
      return
    }
    setTimetableData(data)
  }, [selectedDepartureGroupId, selectedDate])

  // 出発地、日付が変更されたらAPIからデータを再取得
  useEffect(() => {
    if (selectedDepartureGroupId != null && selectedDate) {
      fetchTimetableData()
    }
  }, [selectedDepartureGroupId, selectedDate, fetchTimetableData])

  // 出発地と目的地を入れ替える
  const swapStations = useCallback(() => {
    if (!selectedDepartureGroupId || !selectedDestinationGroupId) return
    if (
      selectedDepartureGroupId === selectedDestinationGroupId ||
      !canSwapStations(selectedDepartureGroupId, selectedDestinationGroupId)
    )
      return
    setSelectedDepartureGroupId(selectedDestinationGroupId)
    setSelectedDestinationGroupId(selectedDepartureGroupId)
  }, [selectedDepartureGroupId, selectedDestinationGroupId])

  // バス停グループ一覧の状態を追加
  const [busStopGroups, setBusStopGroups] = useState<
    components['schemas']['Models.BusStopGroup'][]
  >([])

  // バス停グループ一覧を取得
  useEffect(() => {
    const fetchBusStopGroups = async () => {
      try {
        const { data, error } = await client.GET('/api/bus-stops/groups')
        if (error) {
          setBusStopGroups([])
        } else if (data) {
          setBusStopGroups(data)
        }
      } catch {
        setBusStopGroups([])
      } finally {
        setIsLoadingTimetable(false)
      }
    }
    fetchBusStopGroups()
  }, [])

  // フィルタリングされた時刻表データ
  const filteredTimetable = useMemo(() => {
    if (!timetableData || !selectedDate || !now || selectedDepartureGroupId == null) return []
    return filterTimetable(
      busStopGroups,
      selectedDepartureGroupId, // グループID
      selectedDestinationGroupId, // バス停ID（null許容）
      timeFilter,
      startTime,
      endTime,
      now,
      timetableData
    )
  }, [
    busStopGroups,
    selectedDepartureGroupId,
    selectedDestinationGroupId,
    timeFilter,
    startTime,
    endTime,
    selectedDate,
    now,
    timetableData,
  ])

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 max-w-none xl:w-full">
      <div>
        <div>
          <TimetableFilter
            selectedDeparture={selectedDepartureGroupId}
            setSelectedDeparture={setSelectedDepartureGroupId}
            selectedDestination={selectedDestinationGroupId}
            setSelectedDestination={setSelectedDestinationGroupId}
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
            busStopGroups={busStopGroups} filteredTimetable={[]}            
          />
        </div>
      </div>
    </div>
  )
}
