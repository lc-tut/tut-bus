'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  FaCalendarAlt,
  FaClock,
  FaExchangeAlt,
  FaMapMarkerAlt,
  FaArrowRight,
  FaShuttleVan,
} from 'react-icons/fa'

// バス停データはbusStopsInfoから取得

export interface StopInfo {
  id: string
  name: string
}

// 時刻ペア
export interface TimePair {
  arrival: string // "HH:mm"
  departure: string // "HH:mm"
}

// 日付向けセグメント型（fixed / frequency / shuttle）
export type SegmentForDate =
  | {
      segmentType: 'fixed'
      destination: {
        stopId: string
        stopName: string
      }
      times: TimePair[]
    }
  | {
      // 時刻表ではそれぞれの便が個別に表示される
      segmentType: 'frequency'
      destination: {
        stopId: string
        stopName: string
      }
      startTime: string // "HH:mm"
      endTime: string // "HH:mm"
      intervalMins: number
    }
  | {
      // 時刻表では、特別な枠として[シャトル運行期間中] というような感じで表示される
      // そのため、検索やフィルターではすこし工夫が必要と思われる
      segmentType: 'shuttle'
      destination: {
        stopId: string
        stopName: string
      }
      startTime: string // "HH:mm"
      endTime: string // "HH:mm"
      intervalRange: { min: number; max: number }
    }

// 全体（日付固定版）
export interface ScheduleForDate {
  date: string // "YYYY-MM-DD"

  // ルート共通の出発停留所
  departure: {
    stopId: string
    stopName: string
  }

  // 出発停留所から出る全便のセグメントをまとめて
  segments: SegmentForDate[]
}

// 表示用のバス便情報（内部的に使用）
export interface DisplayBusInfo {
  departureTime: string
  arrivalTime: string
  departure: {
    stopId: string
    stopName: string
  }
  destination: {
    stopId: string
    stopName: string
  }
  date: string
  segmentType: 'fixed' | 'frequency' | 'shuttle'
  isFirstBus: boolean
  isLastBus: boolean
  // シャトル便用の追加情報
  shuttleTimeRange?: {
    startTime: string
    endTime: string
    intervalRange: { min: number; max: number }
  }
}

// APIから取得することを想定
const sampleSchedule: ScheduleForDate[] = [
  {
    date: '2025-05-19',
    departure: {
      stopId: 'station',
      stopName: '八王子駅',
    },
    segments: [
      {
        segmentType: 'fixed',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        times: [
          { departure: '05:30', arrival: '05:35' },
          { departure: '05:45', arrival: '05:50' },
          { departure: '06:00', arrival: '06:05' },
          { departure: '06:10', arrival: '06:15' },
          { departure: '06:20', arrival: '06:25' },
          { departure: '06:30', arrival: '06:35' },
          { departure: '07:00', arrival: '07:20' },
          { departure: '09:00', arrival: '09:20' },
          { departure: '10:00', arrival: '10:20' },
          { departure: '18:00', arrival: '18:20' },
          { departure: '22:30', arrival: '22:50' },
        ],
      },
      {
        segmentType: 'frequency',
        destination: {
          stopId: 'student-hall',
          stopName: '学生会館',
        },
        startTime: '08:30',
        endTime: '17:30',
        intervalMins: 60,
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        startTime: '07:30',
        endTime: '08:30',
        intervalRange: { min: 3, max: 5 },
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        startTime: '17:30',
        endTime: '19:00',
        intervalRange: { min: 4, max: 7 },
      },
    ],
  },
  {
    date: '2025-05-19',
    departure: {
      stopId: 'minami-station',
      stopName: '八王子みなみ野駅',
    },
    segments: [
      {
        segmentType: 'fixed',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        times: [
          { departure: '07:15', arrival: '07:35' },
          { departure: '08:15', arrival: '08:35' },
          { departure: '10:30', arrival: '10:50' },
          { departure: '22:45', arrival: '23:05' },
        ],
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'university',
          stopName: '大学',
        },
        startTime: '08:00',
        endTime: '09:30',
        intervalRange: { min: 5, max: 8 },
      },
    ],
  },
  {
    date: '2025-05-19',
    departure: {
      stopId: 'university',
      stopName: '大学',
    },
    segments: [
      {
        segmentType: 'fixed',
        destination: {
          stopId: 'station',
          stopName: '八王子駅',
        },
        times: [
          { departure: '08:30', arrival: '08:50' },
          { departure: '09:30', arrival: '09:50' },
          { departure: '16:30', arrival: '16:50' },
          { departure: '17:30', arrival: '17:50' },
        ],
      },
      {
        segmentType: 'fixed',
        destination: {
          stopId: 'minami-station',
          stopName: '八王子みなみ野駅',
        },
        times: [
          { departure: '11:00', arrival: '11:20' },
          { departure: '17:00', arrival: '17:20' },
        ],
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'station',
          stopName: '八王子駅',
        },
        startTime: '08:00',
        endTime: '09:00',
        intervalRange: { min: 4, max: 6 },
      },
      {
        segmentType: 'shuttle',
        destination: {
          stopId: 'station',
          stopName: '八王子駅',
        },
        startTime: '18:00',
        endTime: '19:30',
        intervalRange: { min: 5, max: 7 },
      },
    ],
  },
]

// バス停情報
const busStopsInfo = [
  { id: 'university', name: '大学' },
  { id: 'station', name: '八王子駅' },
  { id: 'minami-station', name: '八王子みなみ野駅' },
  { id: 'student-hall', name: '学生会館' },
]

export default function TimetablePage() {
  // 状態管理
  const [selectedDeparture, setSelectedDeparture] = useState<string>('')
  const [selectedDestination, setSelectedDestination] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  const [timeFilter, setTimeFilter] = useState<string>('all')
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false)

  // クライアントサイドでのみ実行される初期化
  useEffect(() => {
    const currentDate = new Date()
    setSelectedDate(currentDate)
    setNow(currentDate)
  }, [])
  const [startTime, setStartTime] = useState<string>('10:00')
  const [endTime, setEndTime] = useState<string>('10:00')

  // 出発地と目的地を入れ替える
  const swapStations = useCallback(() => {
    const tempDeparture = selectedDeparture
    const tempDestination = selectedDestination

    if (!tempDeparture || !tempDestination) return

    // 出発地と目的地を一時的にクリアしてから入れ替える
    setSelectedDeparture('')
    setSelectedDestination('')

    // 少し遅延を入れて状態の更新を確実にする
    setTimeout(() => {
      setSelectedDeparture(tempDestination)
      // さらに少し遅延を入れて、先に出発地が更新されてから目的地を選択する
      setTimeout(() => {
        // バリデーション - 出発地から目的地への経路があるか確認
        const canSwap = sampleSchedule.some((schedule) => {
          return (
            schedule.departure.stopId === tempDestination &&
            schedule.segments.some((segment) => segment.destination.stopId === tempDeparture)
          )
        })

        // 出発地と目的地が同じでなく、経路が存在する場合のみスワップを完了
        if (canSwap && tempDeparture !== tempDestination) {
          setSelectedDestination(tempDeparture)
        }
      }, 50)
    }, 10)
  }, [selectedDeparture, selectedDestination])
  const filteredTimetable = useMemo(() => {
    let displayBuses: DisplayBusInfo[] = []
    const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''

    // サンプルデータからDisplayBusInfoに変換
    for (const schedule of sampleSchedule) {
      // 日付フィルタリング
      if (selectedDateStr && schedule.date !== selectedDateStr) continue

      // 出発地フィルタリング（空文字列の場合はすべての出発地を表示）
      if (selectedDeparture && schedule.departure.stopId !== selectedDeparture) continue

      for (const segment of schedule.segments) {
        // 目的地フィルタリング（空文字列の場合はすべての目的地を表示）
        if (selectedDestination && segment.destination.stopId !== selectedDestination) continue

        if (segment.segmentType === 'fixed') {
          // fixed segmentの処理
          const times = segment.times

          // 最初と最後のバスを識別
          const isFirstBus = (idx: number) => idx === 0
          const isLastBus = (idx: number) => idx === times.length - 1

          for (let i = 0; i < times.length; i++) {
            displayBuses.push({
              departureTime: times[i].departure,
              arrivalTime: times[i].arrival,
              departure: schedule.departure,
              destination: segment.destination,
              date: schedule.date,
              segmentType: 'fixed',
              isFirstBus: isFirstBus(i),
              isLastBus: isLastBus(i),
            })
          }
        } else if (segment.segmentType === 'frequency') {
          // frequency segmentの処理 - 時間間隔に基づいて便を生成
          const startTimeMinutes =
            parseInt(segment.startTime.split(':')[0]) * 60 +
            parseInt(segment.startTime.split(':')[1])
          const endTimeMinutes =
            parseInt(segment.endTime.split(':')[0]) * 60 + parseInt(segment.endTime.split(':')[1])

          for (
            let timeMinutes = startTimeMinutes;
            timeMinutes <= endTimeMinutes;
            timeMinutes += segment.intervalMins
          ) {
            const hours = Math.floor(timeMinutes / 60)
            const minutes = timeMinutes % 60
            const departureTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

            // 到着時間を計算（20分後と仮定）
            const arrivalTimeMinutes = timeMinutes + 20
            const arrivalHours = Math.floor(arrivalTimeMinutes / 60)
            const arrivalMinutes = arrivalTimeMinutes % 60
            const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`

            const isFirstFrequencyBus = timeMinutes === startTimeMinutes
            const isLastFrequencyBus = timeMinutes + segment.intervalMins > endTimeMinutes

            displayBuses.push({
              departureTime,
              arrivalTime,
              departure: schedule.departure,
              destination: segment.destination,
              date: schedule.date,
              segmentType: 'frequency',
              isFirstBus: isFirstFrequencyBus,
              isLastBus: isLastFrequencyBus,
            })
          }
        } else if (segment.segmentType === 'shuttle') {
          // シャトル便の場合、1行だけ表示（時間帯と間隔を表示）
          const startTimeMinutes =
            parseInt(segment.startTime.split(':')[0]) * 60 +
            parseInt(segment.startTime.split(':')[1])

          // 到着時間を計算（運行間隔の最小値を加算）
          const averageTravelTime = 20 // 平均移動時間（分）
          const arrivalTimeMinutes = startTimeMinutes + averageTravelTime
          const arrivalHours = Math.floor(arrivalTimeMinutes / 60)
          const arrivalMinutes = arrivalTimeMinutes % 60
          const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`

          displayBuses.push({
            departureTime: segment.startTime,
            arrivalTime: arrivalTime,
            departure: schedule.departure,
            destination: segment.destination,
            date: schedule.date,
            segmentType: 'shuttle',
            isFirstBus: false,
            isLastBus: false,
            shuttleTimeRange: {
              startTime: segment.startTime,
              endTime: segment.endTime,
              intervalRange: segment.intervalRange,
            },
          })
        }
      }
    }

    // 時間でソート
    displayBuses.sort((a, b) => a.departureTime.localeCompare(b.departureTime))

    // すべてのバスの中から本当の始発と最終便を判定
    if (displayBuses.length > 0) {
      // 一旦すべてのバスをfalseに設定
      displayBuses.forEach((bus) => {
        bus.isFirstBus = false
        bus.isLastBus = false
      })

      // 出発地-目的地の組み合わせごとに始発と最終便を設定
      const routeGroups = new Map<string, { first: DisplayBusInfo; last: DisplayBusInfo }>()

      displayBuses.forEach((bus) => {
        const routeKey = `${bus.departure.stopId}-${bus.destination.stopId}`
        if (!routeGroups.has(routeKey)) {
          routeGroups.set(routeKey, { first: bus, last: bus })
        } else {
          const current = routeGroups.get(routeKey)!
          if (bus.departureTime < current.first.departureTime) {
            current.first = bus
          }
          if (bus.departureTime > current.last.departureTime) {
            current.last = bus
          }
        }
      })

      // 判定結果を反映
      for (const { first, last } of routeGroups.values()) {
        first.isFirstBus = true
        last.isLastBus = true
      }
    }

    // 各種フィルターを適用
    if (timeFilter === 'preDeparture') {
      if (now) {
        // 現在時刻以降のバスをフィルタリング
        const nowTimeStr = format(now, 'HH:mm')
        displayBuses = displayBuses.filter((bus) => bus.departureTime >= nowTimeStr)
      }
    } else if (timeFilter === 'departure') {
      // 出発時間を指定（startTimeから出発するバス）
      displayBuses = displayBuses.filter((bus) => bus.departureTime >= startTime)
    } else if (timeFilter === 'arrival') {
      // 到着時間を指定（endTimeまでに到着するバス）
      displayBuses = displayBuses.filter((bus) => bus.arrivalTime <= endTime)
      
      // 現在時刻がある場合は、現在時刻との差が小さい順にソート
      if (now) {
        const nowStr = format(now, 'HH:mm');
        const nowHours = parseInt(nowStr.split(':')[0]);
        const nowMinutes = parseInt(nowStr.split(':')[1]);
        const nowTotalMinutes = nowHours * 60 + nowMinutes;
        
        // 各バスの到着時刻と現在時刻の差を計算してソート
        displayBuses.sort((a, b) => {
          // a の到着時間を分換算
          const aHours = parseInt(a.arrivalTime.split(':')[0]);
          const aMinutes = parseInt(a.arrivalTime.split(':')[1]);
          const aTotalMinutes = aHours * 60 + aMinutes;
          
          // b の到着時間を分換算
          const bHours = parseInt(b.arrivalTime.split(':')[0]);
          const bMinutes = parseInt(b.arrivalTime.split(':')[1]);
          const bTotalMinutes = bHours * 60 + bMinutes;
          
          // 現在時刻との差（絶対値）を計算
          const aDiff = Math.abs(aTotalMinutes - nowTotalMinutes);
          const bDiff = Math.abs(bTotalMinutes - nowTotalMinutes);
          
          // 差が小さい順にソート
          return aDiff - bDiff;
        });
      } else {
        // 現在時刻がない場合は到着時間順
        displayBuses.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
      }
      
      return displayBuses;
    }
    
    // arrival以外の場合は常に出発時間でソート
    displayBuses.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
    
    return displayBuses
  }, [selectedDeparture, selectedDestination, timeFilter, startTime, endTime, selectedDate, now])

  // バスの到着時間を計算（現在時刻との差分）
  const getBusStatus = useCallback(
    (departureTime: string, index: number, buses: DisplayBusInfo[]) => {
      if (!now) return { status: 'scheduled', text: '時刻計算中...' }

      // 現在時刻を文字列に変換（HH:mm形式）
      const nowStr = format(now, 'HH:mm')

      // departureTimeとnowStrを分単位で比較
      const depHours = parseInt(departureTime.split(':')[0])
      const depMinutes = parseInt(departureTime.split(':')[1])
      const nowHours = parseInt(nowStr.split(':')[0])
      const nowMinutes = parseInt(nowStr.split(':')[1])

      const depTotalMinutes = depHours * 60 + depMinutes
      const nowTotalMinutes = nowHours * 60 + nowMinutes

      // 時間差を計算（分単位）
      const diffMinutes = depTotalMinutes - nowTotalMinutes

      // 日をまたいだケースを考慮（例：現在23:50、出発時間00:10の場合）
      const adjustedDiffMinutes = diffMinutes < -720 ? diffMinutes + 1440 : diffMinutes

      if (adjustedDiffMinutes < 0) {
        // 出発済みの場合、直近一本前かどうかを確認
        // 次のバスがある場合、そのバスが出発済みでないかチェック
        if (index + 1 < buses.length) {
          const preDeparture = buses[index + 1]
          const nextDepHours = parseInt(preDeparture.departureTime.split(':')[0])
          const nextDepMinutes = parseInt(preDeparture.departureTime.split(':')[1])
          const nextDepTotalMinutes = nextDepHours * 60 + nextDepMinutes
          const nextDiffMinutes = nextDepTotalMinutes - nowTotalMinutes
          const nextAdjustedDiffMinutes =
            nextDiffMinutes < -720 ? nextDiffMinutes + 1440 : nextDiffMinutes

          if (nextAdjustedDiffMinutes >= 0) {
            // 次のバスがまだ出発していない場合、これが直近一本前
            return { status: 'departed', text: '出発済み' }
          } else {
            // 次のバスも出発済みの場合は何も表示しない
            return { status: 'departed', text: '' }
          }
        } else {
          // 最後のバスが出発済みならば表示する
          return { status: 'departed', text: '出発済み' }
        }
      }

      if (adjustedDiffMinutes < 5) return { status: 'imminent', text: 'まもなく出発' }
      if (adjustedDiffMinutes < 15)
        return { status: 'soon', text: `出発まで${adjustedDiffMinutes}分` }
      if (adjustedDiffMinutes < 60)
        return { status: 'scheduled', text: `あと${adjustedDiffMinutes}分` }
      return { status: 'scheduled', text: '' } // 1時間以上先は表示しない
    },
    [now]
  )

  // 日付タブの設定
  const dateTabs = useMemo(
    () => [
      { value: 'today', label: '今日', date: now },
      { value: 'tomorrow', label: '明日', date: now ? addDays(now, 1) : null },
      { value: 'custom', label: '日付指定', date: null },
    ],
    [now]
  )

  // 出発地に基づく利用可能な目的地を取得
  const availableDestinations = useMemo(() => {
    // 出発地を除外した目的地のリストを返す
    if (!selectedDeparture) return busStopsInfo
    // 出発地として選択された停留所を除外
    return busStopsInfo.filter((stop) => stop.id !== selectedDeparture)
  }, [selectedDeparture])

  // 目的地に基づく利用可能な出発地を取得
  const availableDepartures = useMemo(() => {
    // 目的地が選択されていない場合はすべての出発地を返す
    // 目的地と同じ出発地は選べないようにする
    if (!selectedDestination) return busStopsInfo
    return busStopsInfo.filter((stop) => stop.id !== selectedDestination)
  }, [selectedDestination])

  // 各種セグメントタイプの運行情報を表示するコンポーネント
  function RouteInfoCard() {
    if (!selectedDeparture || !selectedDestination) return null

    // フィルタリングされた運行情報から各セグメントを抽出
    const shuttleSegments: SegmentForDate[] = []

    for (const schedule of sampleSchedule) {
      if (schedule.departure.stopId === selectedDeparture) {
        for (const segment of schedule.segments) {
          if (
            segment.destination.stopId === selectedDestination &&
            segment.segmentType === 'shuttle'
          ) {
            shuttleSegments.push(segment)
          }
        }
      }
    }

    // 時間帯でソート
    shuttleSegments.sort((a, b) => {
      if (a.segmentType === 'shuttle' && b.segmentType === 'shuttle') {
        return a.startTime.localeCompare(b.startTime)
      }
      return 0
    })

    return (
      <div className="space-y-3">
        {shuttleSegments.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-3">
              <div className="bg-purple-600 text-white rounded-full p-0.5 flex items-center justify-center w-5 h-5">
                <FaShuttleVan className="h-3 w-3" />
              </div>
              <span>シャトル便運行情報</span>
              {shuttleSegments.length > 1 && (
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-2 h-5 border-purple-400 text-purple-700 font-medium ml-1"
                >
                  {shuttleSegments.length}時間帯
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {shuttleSegments.map((segment, index) => {
                // segmentTypeがshuttleの場合のみ処理を進める
                if (segment.segmentType !== 'shuttle') return null

                return (
                  <div key={`shuttle-${index}`} className="text-xs text-purple-800">
                    {shuttleSegments.length > 1 && (
                      <div className="flex items-center mb-2">
                        <Badge className="bg-purple-200 text-purple-800 text-[10px] py-0 px-2 h-5 font-medium border-0">
                          時間帯 {index + 1}
                        </Badge>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-purple-500 mb-1">行き先</p>
                        <div className="font-medium">
                          {segment.destination.stopName}
                        </div>
                      </div>

                      <div>
                        <p className="text-purple-500 mb-1">運行時間帯</p>
                        <div className="font-medium">
                          {segment.startTime} 〜 {segment.endTime}
                        </div>
                      </div>

                      <div>
                        <p className="text-purple-500 mb-1">運行間隔</p>
                        <div className="font-medium">
                          約{segment.intervalRange.min}〜{segment.intervalRange.max}分
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="bg-purple-100/50 rounded-md p-2.5 mt-2">
                <p className="font-medium mb-1.5">シャトル便について</p>
                <p className="text-[11px] leading-tight">
                  シャトル便は乗客数や交通状況により運行間隔が変動します。この時間帯は頻繁にバスが運行するため、時刻表に個別の発車時刻は記載されていません。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 max-w-none xl:w-full">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        <div>
          <Card className="shadow-sm overflow-hidden pt-0 gap-2">
            <CardHeader className="pb-2 pt-4 px-5 bg-muted">
              <CardTitle className="text-base font-semibold flex items-center">
                <FaMapMarkerAlt className="mr-2 h-3.5 w-3.5" />
                検索条件
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-5">
                {/* 日付選択 */}{' '}
                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium flex items-center">
                      <FaCalendarAlt className="mr-2 h-3 w-3" />
                      日付
                    </label>
                  </div>
                  <div className="space-y-3">
                    <Tabs
                      value={
                        !selectedDate || !now
                          ? 'today'
                          : format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                            ? 'today'
                            : format(selectedDate, 'yyyy-MM-dd') ===
                                format(addDays(now, 1), 'yyyy-MM-dd')
                              ? 'tomorrow'
                              : 'custom'
                      }
                      className="w-full"
                      onValueChange={(value) => {
                        if (value === 'today') {
                          // 「今日」タブを選択した場合は、今日の日付に設定
                          setSelectedDate(new Date())
                        } else if (value === 'tomorrow') {
                          // 「明日」タブを選択した場合は、明日の日付に設定
                          setSelectedDate(addDays(new Date(), 1))
                        } else if (value === 'custom') {
                          // 「日付指定」タブを選択した場合は、カレンダーを表示
                          setCalendarOpen(true)
                        }
                      }}
                    >
                      <TabsList className="grid grid-cols-3 w-full bg-muted p-1 h-auto">
                        {dateTabs.map((tab) => (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="px-3 py-2 text-xs font-medium relative rounded-md data-[state=active]:bg-background"
                          >
                            {tab.value === 'today' && (
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                {tab.label}
                              </span>
                            )}
                            {tab.value === 'tomorrow' && (
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                {tab.label}
                              </span>
                            )}
                            {tab.value === 'custom' && (
                              <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <DialogTrigger asChild>
                                  <span className="flex items-center gap-1.5 cursor-pointer">
                                    <FaCalendarAlt className="h-3 w-3" />
                                    {tab.label}
                                    {selectedDate &&
                                      now &&
                                      format(selectedDate, 'yyyy-MM-dd') !==
                                        format(now, 'yyyy-MM-dd') &&
                                      format(selectedDate, 'yyyy-MM-dd') !==
                                        format(addDays(now, 1), 'yyyy-MM-dd') && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                                      )}
                                  </span>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>日付を選択</DialogTitle>
                                  </DialogHeader>
                                  <div className="flex items-center justify-center">
                                    <Calendar
                                      mode="single"
                                      selected={selectedDate ?? undefined}
                                      onSelect={(date: Date | undefined) => {
                                        if (date) {
                                          setSelectedDate(date)
                                          // 日付選択後にダイアログを閉じる
                                          setCalendarOpen(false)
                                        }
                                      }}
                                      initialFocus
                                      locale={ja}
                                      className="mx-auto"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>

                    {selectedDate && now && (
                      <div
                        className={cn(
                          'px-4 py-3 text-sm font-medium rounded-md flex items-center justify-center',
                          format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : format(selectedDate, 'yyyy-MM-dd') ===
                                format(addDays(now, 1), 'yyyy-MM-dd')
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'border'
                        )}
                      >
                        <FaCalendarAlt
                          className={cn(
                            'mr-2 h-3.5 w-3.5',
                            format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                              ? 'text-green-500'
                              : format(selectedDate, 'yyyy-MM-dd') ===
                                  format(addDays(now, 1), 'yyyy-MM-dd')
                                ? 'text-blue-500'
                                : 'text-muted-foreground'
                          )}
                        />
                        {format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                          ? `今日 ${format(selectedDate, 'M月d日(E)', { locale: ja })}`
                          : format(selectedDate, 'yyyy-MM-dd') ===
                              format(addDays(now, 1), 'yyyy-MM-dd')
                            ? `明日 ${format(selectedDate, 'M月d日(E)', { locale: ja })}`
                            : format(selectedDate, 'yyyy年M月d日(E)', { locale: ja })}
                      </div>
                    )}
                  </div>
                </div>
                {/* 区切り線 */}
                <div className="border-t my-4"></div>
                {/* 出発地と目的地 */}
                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium flex items-center">
                      <FaMapMarkerAlt className="mr-2 h-3 w-3" />
                      出発地
                    </label>
                  </div>
                  <Select
                    value={selectedDeparture}
                    onValueChange={(value) => {
                      setSelectedDeparture(value)
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        'rounded-md h-10 w-full',
                        !selectedDeparture ? 'text-muted-foreground' : ''
                      )}
                    >
                      <SelectValue
                        placeholder={
                          selectedDestination && availableDepartures.length === 0
                            ? '利用可能な出発地がありません'
                            : '出発地を選択'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartures.length === 0 && selectedDestination ? (
                        <div className="py-2 px-2 text-xs text-muted-foreground text-center">
                          選択した目的地への経路がありません
                        </div>
                      ) : (
                        <div>
                          {availableDepartures.map((stop) => (
                            <SelectItem key={stop.id} value={stop.id}>
                              {stop.name}
                            </SelectItem>
                          ))}
                          {availableDepartures.length === 0 && (
                            <div className="py-2 px-2 text-xs text-muted-foreground text-center">
                              利用可能な出発地がありません
                            </div>
                          )}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium flex items-center">
                      <FaMapMarkerAlt className="mr-2 h-3 w-3" />
                      目的地
                    </label>
                    {selectedDeparture && selectedDestination && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={swapStations}
                        className="h-7 px-2 rounded text-xs font-medium flex items-center gap-1"
                      >
                        <FaExchangeAlt className="h-3 w-3" />
                        <span>入れ替え</span>
                      </Button>
                    )}
                  </div>{' '}
                  <Select
                    value={selectedDestination}
                    onValueChange={(value) => {
                      // 未選択が選ばれた場合は空文字列をセット
                      if (value === '__unselected__') {
                        setSelectedDestination('')
                      } else {
                        setSelectedDestination(value)
                      }
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        'rounded-md h-10 w-full',
                        !selectedDestination ? 'text-muted-foreground' : ''
                      )}
                    >
                      <SelectValue
                        placeholder={
                          !selectedDeparture
                            ? '先に出発地を選択してください'
                            : availableDestinations.length === 0
                              ? '利用可能な目的地がありません'
                              : '目的地を選択'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!selectedDeparture ? (
                        <div className="py-2 px-2 text-xs text-muted-foreground text-center">
                          先に出発地を選択してください
                        </div>
                      ) : availableDestinations.length === 0 ? (
                        <div className="py-2 px-2 text-xs text-muted-foreground text-center">
                          選択した出発地からの経路がありません
                        </div>
                      ) : (
                        <div>
                          <SelectItem key="__unselected__" value="__unselected__">
                            未選択
                          </SelectItem>
                          {availableDestinations.map((stop) => (
                            <SelectItem key={stop.id} value={stop.id}>
                              {stop.name}
                            </SelectItem>
                          ))}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* 区切り線 */}
                <div className="border-t my-4"></div>
                {/* 時間帯設定 */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <div className="mb-2">
                      <label className="text-sm font-medium flex items-center">
                        <FaClock className="mr-2 h-3 w-3" />
                        時間帯
                      </label>
                    </div>
                    <Select defaultValue="all" onValueChange={(value) => setTimeFilter(value)}>
                      <SelectTrigger className="rounded-md h-10 w-full">
                        <SelectValue placeholder="すべての時間" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべての時間</SelectItem>
                        <SelectItem value="preDeparture">出発前</SelectItem>
                        <SelectItem value="departure">出発時間を指定</SelectItem>
                        <SelectItem value="arrival">到着時間を指定</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {timeFilter === 'departure' && (
                    <div>
                      <div className="mb-2">
                        <label className="text-sm font-medium flex items-center">
                          <FaArrowRight className="mr-2 h-3 w-3" />
                          出発時間
                        </label>
                      </div>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="rounded-md h-10 w-fulll"
                      />
                    </div>
                  )}

                  {timeFilter === 'arrival' && (
                    <div>
                      <div className="mb-2">
                        <label className="text-sm font-medium flex items-center">
                          <FaArrowRight className="mr-2 h-3 w-3" />
                          到着時間
                        </label>
                      </div>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="rounded-md h-10 w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm overflow-hidden pt-0 gap-2">
          <CardHeader className="pb-2 pt-4 px-5 bg-muted">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex flex-wrap justify-left items-center gap-0 text-base font-semibold">
                <FaClock className="mr-1 h-3.5 w-3.5" />
                <span className="ml-1">時刻表</span>
                {selectedDeparture && (
                  <div className="flex flex-wrap items-center">
                    <span className="font-normal text-sm mx-2">|</span>
                    <span>
                      {busStopsInfo.find((stop) => stop.id === selectedDeparture)?.name}
                    </span>
                    {selectedDestination && (
                      <>
                        <FaArrowRight className="h-2.5 w-2.5 text-muted-foreground mx-2" />
                        <span>
                          {busStopsInfo.find((stop) => stop.id === selectedDestination)?.name}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 ml-auto">
                {selectedDeparture && filteredTimetable.length > 0 && (
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-xs">
                    {filteredTimetable.length}便
                  </Badge>
                )}
                {selectedDeparture &&
                  filteredTimetable.some((bus) => bus.segmentType === 'shuttle') && (
                    <Badge className="px-2.5 py-0.5 text-xs border-purple-400 bg-purple-700">
                      シャトル{' '}
                      {filteredTimetable.filter((bus) => bus.segmentType === 'shuttle').length}便
                    </Badge>
                  )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedDeparture ? (
              <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FaMapMarkerAlt className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="mt-2 text-base font-medium">出発地を選択してください</h3>
                <p className="mt-2 text-xs text-muted-foreground max-w-xs">
                  出発地を選択すると、利用可能な時刻表が表示されます。
                </p>
              </div>
            ) : filteredTimetable.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FaClock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-2 text-base font-medium">Not Found</h3>
                <p className="mt-2 text-xs text-muted-foreground max-w-xs">
                  選択された条件に一致するバスが見つかりませんでした。
                </p>
              </div>
            ) : (
              <>
                {/* 経路情報があれば表示 */}
                {selectedDeparture && selectedDestination && (
                  <div className="px-4 pt-3">
                    <RouteInfoCard />
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium px-[32px]">目的地</TableHead>
                      <TableHead className="text-xs font-medium">出発時刻</TableHead>
                      <TableHead className="text-xs font-medium hidden md:table-cell">
                        到着時刻
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium "></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTimetable.map((bus, idx) => {
                      const busStatus = getBusStatus(bus.departureTime, idx, filteredTimetable)

                      return (
                        <TableRow
                          key={idx}
                          className={cn(
                            'hover:bg-muted/50',
                            busStatus.status === 'imminent'
                              ? 'bg-red-200/80 border-l-2 border-b-0 border-red-500'
                              : busStatus.status === 'soon'
                                ? 'bg-blue-50/80 px-2'
                                : bus.segmentType === 'shuttle'
                                  ? 'bg-purple-50/80'
                                  : undefined
                          )}
                        >
                          <TableCell
                            className={cn(
                              'text-sm',
                              bus.segmentType === 'shuttle' &&
                                'bg-purple-100/40 border-l-2 border-purple-500'
                            )}
                          >
                            <div className="flex items-center gap-1.5 px-4">
                              <span
                                className={
                                  bus.segmentType === 'shuttle' ? 'font-medium text-purple-700' : ''
                                }
                              >
                                {bus.destination.stopName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell
                            className={cn(
                              'font-mono',
                              bus.segmentType === 'shuttle' && 'bg-purple-100/40'
                            )}
                          >
                            {bus.segmentType === 'shuttle' && bus.shuttleTimeRange ? (
                              <div className="flex items-start flex-col sm:flex-row">
                                <span className="font-medium text-purple-700 text-xs md:text-sm">
                                  {bus.shuttleTimeRange.startTime}
                                </span>
                                <span className="font-medium text-purple-700 text-xs sm:text-sm">
                                  &nbsp;~&nbsp;{bus.shuttleTimeRange.endTime}
                                </span>
                              </div>
                            ) : (
                              <span>{bus.departureTime}</span>
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'font-mono hidden md:table-cell',
                              bus.segmentType === 'shuttle' && 'bg-purple-100/40'
                            )}
                          >
                            {bus.segmentType === 'shuttle' && bus.shuttleTimeRange ? (
                              <span className="font-medium text-purple-700 text-xs">
                                約{bus.shuttleTimeRange.intervalRange.min}～
                                {bus.shuttleTimeRange.intervalRange.max}分間隔
                              </span>
                            ) : (
                              <span className="font-mono">{bus.arrivalTime}</span>
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right',
                              bus.segmentType === 'shuttle' && 'bg-purple-100/40'
                            )}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              {/* シャトル便と通常のバスで表示内容を分ける */}
                              {bus.segmentType === 'shuttle' ? (
                                <div className="flex items-center gap-1.5">
                                  <Badge className="md:hidden bg-purple-700 text-[10px]">
                                    約{bus.shuttleTimeRange?.intervalRange.min}～
                                    {bus.shuttleTimeRange?.intervalRange.max}分間隔
                                  </Badge>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  {/* 状態テキストを先に表示 */}
                                  <span
                                    className={cn(
                                      'text-xs font-medium',
                                      busStatus.status === 'departed'
                                        ? 'text-muted-foreground'
                                        : busStatus.status === 'imminent'
                                          ? 'text-red-500'
                                          : busStatus.status === 'soon'
                                            ? 'text-blue-500'
                                            : 'text-foreground'
                                    )}
                                  >
                                    {busStatus.text}
                                  </span>

                                  <Badge className="md:hidden bg-muted text-muted-foreground">
                                    {bus.arrivalTime}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
