'use client'

import { TimetableDisplay } from '@/components/timetable/timetable-display'
import { TimetableFilter } from '@/components/timetable/timetable-filter'
import type { components, operations } from '@/generated/oas'
import { client } from '@/lib/client'
import { TimeFilterType } from '@/lib/types/timetable'
import { getCachedResponse, getLatestCachedTimetable } from '@/lib/utils/cache'
import { canSwapStations, filterTimetable } from '@/lib/utils/timetable'
import { format, parseISO } from 'date-fns'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { BiWifiOff } from 'react-icons/bi'

// データ取得失敗時の自動リダイレクトコンポーネント
function AutoRedirect() {
  useEffect(() => {
    console.error('[AutoRedirect:timetable] No data available, redirecting to /~offline')
    window.location.href = '/~offline'
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
      <BiWifiOff className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-base font-medium">データを取得できません</h3>
      <p className="mt-2 text-xs text-muted-foreground max-w-xs mb-6">
        オフラインページに移動しています...
      </p>
      <a
        href="/~offline"
        className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
      >
        オフラインページへ
      </a>
    </div>
  )
}

export default function TimetablePage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-6 space-y-6 px-4">Loading...</div>}>
      <TimetableContent />
    </Suspense>
  )
}

function TimetableContent() {
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

    // 現在のURLと同じならスキップ（無限ループ防止）
    const newSearch = params.toString()
    const currentSearch = new URLSearchParams(window.location.search).toString()
    if (newSearch === currentSearch) return

    // URLを更新（履歴を残さない）
    // window.history.replaceState を使用: router.replace だとRSCフェッチが発生し、
    // オフライン時に失敗→ブラウザフォールバック→リロード→ループの原因になる
    const newUrl = newSearch ? `/timetable?${newSearch}` : '/timetable'
    window.history.replaceState(null, '', newUrl)
  }, [
    selectedDepartureGroupId,
    selectedDestinationGroupId,
    selectedDate,
    timeFilter,
    startTime,
    endTime,
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

    if (departureParam && !isNaN(Number(departureParam))) {
      setSelectedDepartureGroupId(Number(departureParam))
    }

    if (destinationParam && !isNaN(Number(destinationParam))) {
      setSelectedDestinationGroupId(Number(destinationParam))
    }

    if (dateParam) {
      try {
        const parsedDate = parseISO(dateParam)
        if (isNaN(parsedDate.getTime())) {
          setSelectedDate((prev) => prev ?? new Date())
        } else {
          setSelectedDate((prev) => {
            if (prev && format(prev, 'yyyy-MM-dd') === dateParam) return prev
            return parsedDate
          })
        }
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
    if (!searchParams.get('date')) {
      setSelectedDate(currentDate)
    }
    setNow(currentDate)

    // 1分ごとに現在時刻を更新
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    try {
      // client.GET の期待する型に合わせて修正
      const paramsForGet: operations['BusStopGroupsService_getBusStopGroupsTimetable']['parameters'] =
        {
          path: {
            id: selectedDepartureGroupId,
          },
        }
      paramsForGet.query = { date: format(selectedDate!, 'yyyy-MM-dd') }
      // client.GET の呼び出しでは、{ params: ... } の形にする
      const { data, error } = await client.GET('/api/bus-stops/groups/{id}/timetable', {
        params: paramsForGet,
      })
      if (error) {
        console.error('Failed to fetch timetable data:', error)
        // API エラー時は Cache API にフォールバック（同一日付のみ）
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const cached = await getLatestCachedTimetable<
          components['schemas']['Models.BusStopGroupTimetable']
        >(selectedDepartureGroupId, dateStr)
        if (cached) {
          setTimetableData(cached)
        } else {
          // API到達不能 + キャッシュなし → リダイレクト
          window.location.href = '/~offline'
          return
        }
        return
      }
      setTimetableData(data)
    } catch (e) {
      console.error('Network error fetching timetable:', e)
      // ネットワークエラー時は Cache API にフォールバック（同一日付のみ）
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const cached = await getLatestCachedTimetable<
        components['schemas']['Models.BusStopGroupTimetable']
      >(selectedDepartureGroupId, dateStr)
      if (cached) {
        setTimetableData(cached)
      } else {
        // ネットワークエラー + キャッシュなし → リダイレクト
        window.location.href = '/~offline'
        return
      }
    } finally {
      setIsLoadingTimetable(false)
    }
  }, [selectedDepartureGroupId, selectedDate])

  // 出発地、日付が変更されたらAPIからデータを再取得
  useEffect(() => {
    if (selectedDepartureGroupId != null && selectedDate) {
      fetchTimetableData()
    }
  }, [selectedDepartureGroupId, selectedDate, fetchTimetableData])

  // オフライン時に時刻表データが0便なら /~offline にリダイレクト
  // SWがキャッシュした0便レスポンスで通常ページが表示されるのを防ぐ
  useEffect(() => {
    if (isLoadingTimetable || selectedDepartureGroupId == null) return
    if (!timetableData) return

    let busCount = 0
    for (const seg of timetableData.segments ?? []) {
      if (seg.segmentType === 'fixed') {
        busCount += seg.times.length
      } else {
        busCount += 1
      }
    }

    if (busCount === 0) {
      window.location.href = '/~offline'
    }
  }, [timetableData, isLoadingTimetable, selectedDepartureGroupId])

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
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)

  // バス停グループ一覧を取得
  useEffect(() => {
    const fetchBusStopGroups = async () => {
      try {
        const { data, error } = await client.GET('/api/bus-stops/groups')
        if (error) {
          // API エラー時は Cache API にフォールバック
          const cached =
            await getCachedResponse<components['schemas']['Models.BusStopGroup'][]>(
              '/api/bus-stops/groups'
            )
          if (cached && cached.length > 0) {
            setBusStopGroups(cached)
          } else {
            // API到達不能 + キャッシュなし → リダイレクト
            window.location.href = '/~offline'
            return
          }
        } else if (data) {
          setBusStopGroups(data)
        }
      } catch {
        // ネットワークエラー時も Cache API にフォールバック
        const cached =
          await getCachedResponse<components['schemas']['Models.BusStopGroup'][]>(
            '/api/bus-stops/groups'
          )
        if (cached && cached.length > 0) {
          setBusStopGroups(cached)
        } else {
          window.location.href = '/~offline'
          return
        }
      } finally {
        setIsLoadingGroups(false)
      }
    }
    fetchBusStopGroups()
  }, [])

  // グループデータが取得できなかった場合リダイレクト
  useEffect(() => {
    if (isLoadingGroups) return
    if (busStopGroups.length === 0) {
      window.location.href = '/~offline'
    }
  }, [busStopGroups, isLoadingGroups])

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

  // マウント前はスケルトンを表示（Radix UIのhydration mismatchを防ぐ）
  if (!now) {
    return (
      <div className="container mx-auto py-6 space-y-6 px-4 max-w-none xl:w-full">
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  // ローディング完了後にデータが空 → /~offline にリダイレクト
  if (!isLoadingGroups && busStopGroups.length === 0) {
    return <AutoRedirect />
  }

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 pb-28 max-w-none xl:w-full">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
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
            busStopGroups={busStopGroups}
          />
        </div>
        <TimetableDisplay
          selectedDeparture={selectedDepartureGroupId}
          selectedDestination={selectedDestinationGroupId}
          filteredTimetable={filteredTimetable}
          now={now}
          timetableData={timetableData}
          busStopGroups={busStopGroups}
          isLoading={isLoadingTimetable}
        />
      </div>
    </div>
  )
}
