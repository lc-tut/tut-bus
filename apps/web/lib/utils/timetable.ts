import type { components } from '@/generated/oas'
import { format } from 'date-fns'
import { BusStatus, DisplayBusInfo, StopInfo, TimeFilterType } from '../types/timetable'

/**
 * 時刻表データから表示用バスデータを生成します
 */
export const generateDisplayBuses = (
  busStopGroups: components['schemas']['Models.BusStopGroup'][],
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null,
  selectedDestinationGroupId: number | null // 目的地グループID（null許容）
): DisplayBusInfo[] => {
  const displayBuses: DisplayBusInfo[] = []
  if (!timetableData || !timetableData.segments) return displayBuses

  // APIのデータ構造に合わせて変換
  for (const segment of timetableData.segments) {
    // destination.stopIdからグループIDを特定
    const stopIdNum = Number(segment.destination.stopId)
    const group = busStopGroups.find((g) => g.busStops.some((s) => s.id === stopIdNum))
    const destinationGroupId = group ? group.id : stopIdNum // fallback: stopId自身
    if (selectedDestinationGroupId !== null && destinationGroupId !== selectedDestinationGroupId) {
      continue
    }

    const departureInfo = {
      stopId: timetableData.id.toString(),
      stopName: timetableData.name,
      groupId: timetableData.id,
    }

    const destinationInfo = {
      stopId: segment.destination.stopId.toString(),
      stopName: segment.destination.stopName,
      groupId: destinationGroupId,
    }

    if (segment.segmentType === 'fixed' && segment.times && segment.times.length > 0) {
      segment.times.forEach((time) => {
        displayBuses.push({
          departureTime: time.departure,
          arrivalTime: time.arrival,
          departure: departureInfo,
          destination: destinationInfo,
          date: timetableData.date,
          segmentType: 'fixed',
          isFirstBus: false,
          isLastBus: false,
        })
      })
    } else if (
      segment.segmentType === 'shuttle' &&
      segment.startTime &&
      segment.endTime &&
      segment.intervalRange
    ) {
      displayBuses.push({
        departureTime: segment.startTime,
        arrivalTime: segment.endTime,
        departure: departureInfo,
        destination: destinationInfo,
        date: timetableData.date,
        segmentType: 'shuttle',
        isFirstBus: false,
        isLastBus: false,
        shuttleTimeRange: {
          startTime: segment.startTime,
          endTime: segment.endTime,
          intervalRange: {
            min: segment.intervalRange.min,
            max: segment.intervalRange.max,
          },
        },
      })
    }
  }

  displayBuses.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))

  // ソート後に目的地ごとにグループ化して、その日全体での最初と最後のバスを特定する
  if (displayBuses.length > 0) {
    // 目的地グループIDごとにバスをグループ化
    const busesByDestination: { [key: string]: DisplayBusInfo[] } = {}

    displayBuses.forEach((bus) => {
      const destId = bus.destination.stopId.toString()
      if (!busesByDestination[destId]) {
        busesByDestination[destId] = []
      }
      busesByDestination[destId].push(bus)
    })

    // 各目的地グループ内で、最初と最後のバスを設定
    Object.values(busesByDestination).forEach((destinationBuses) => {
      if (destinationBuses.length > 0) {
        destinationBuses.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))
        destinationBuses.forEach((bus) => {
          bus.isFirstBus = false
          bus.isLastBus = false
        })
        destinationBuses[0].isFirstBus = true
        destinationBuses[destinationBuses.length - 1].isLastBus = true
      }
    })
  }

  return displayBuses
}

/**
 * 日付と出発地、目的地などの条件に基づいてバスの時刻表をフィルタリングします
 */
export const filterTimetable = (
  busStopGroups: components['schemas']['Models.BusStopGroup'][],
  selectedDepartureGroupId: number, // 出発地グループID
  selectedDestinationGroupId: number | null, // 目的地グループID（null許容）
  timeFilter: TimeFilterType,
  startTime: string,
  endTime: string,
  now: Date | null,
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null
): DisplayBusInfo[] => {
  let displayBuses = generateDisplayBuses(busStopGroups, timetableData, selectedDestinationGroupId)

  displayBuses = displayBuses.filter(
    (bus) => Number(bus.departure.stopId) === selectedDepartureGroupId
  )

  displayBuses.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))

  if (timeFilter === 'all') {
    // 'all' の場合は既にソート済みなので何もしない
  } else if (timeFilter === 'preDeparture') {
    displayBuses = applyPreDepartureFilter(displayBuses, now)
  } else if (timeFilter === 'departure') {
    displayBuses = applyDepartureTimeFilter(displayBuses, startTime)
  } else if (timeFilter === 'arrival') {
    displayBuses = applyArrivalTimeFilter(displayBuses, endTime)
    displayBuses.sort((a, b) => {
      const arrivalA = a.arrivalTime || a.departureTime
      const arrivalB = b.arrivalTime || b.departureTime
      return toMinutes(arrivalB) - toMinutes(arrivalA)
    })
  }

  return displayBuses
}

/**
 * 出発地に基づいて利用可能な目的地のリストを返します
 */
export const getAvailableDestinations = (
  selectedDepartureGroupId: number, // グループID
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null
): StopInfo[] => {
  if (!timetableData || !timetableData.segments) return []
  // 出発地グループIDと同じグループの目的地は除外
  return timetableData.segments
    .filter((segment) => Number(segment.destination.stopId) !== selectedDepartureGroupId)
    .map((segment) => ({
      id: Number(segment.destination.stopId),
      name: segment.destination.stopName,
    }))
}

export const getAvailableDepartures = (
  selectedDestinationGroupId: number, // グループID
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null
): StopInfo[] => {
  if (!timetableData) return []
  const departures: StopInfo[] = [
    {
      id: timetableData.id,
      name: timetableData.name,
    },
  ]
  if (!selectedDestinationGroupId) return departures
  return departures.filter((dep) => dep.id !== selectedDestinationGroupId)
}

export const canSwapStations = (
  selectedDepartureGroupId: number, // グループID
  selectedDestinationGroupId: number // グループID
): boolean => {
  return !!selectedDepartureGroupId && !!selectedDestinationGroupId
}

export const getShuttleSegments = (
  busStopGroups: components['schemas']['Models.BusStopGroup'][],
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null,
  selectedDepartureGroupId: number,
  selectedDestinationGroupId: number
): DisplayBusInfo[] => {
  return generateDisplayBuses(busStopGroups, timetableData, selectedDestinationGroupId).filter(
    (bus) =>
      bus.segmentType === 'shuttle' &&
      Number(bus.departure.stopId) === selectedDepartureGroupId &&
      Number(bus.destination.stopId) === selectedDestinationGroupId
  )
}

// "HH:mm" 形式の時刻文字列を分単位の数値に変換する関数
const toMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) {
    // timeStr が null や undefined、または予期せぬ形式の場合のフォールバック
    return 0 // またはエラーをスローするか、適切なデフォルト値を返す
  }
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

const isTimeAfterOrEqual = (time1: string, time2: string): boolean => {
  return toMinutes(time1) >= toMinutes(time2)
}

const isTimeBeforeOrEqual = (time1: string, time2: string): boolean => {
  return toMinutes(time1) <= toMinutes(time2)
}

const getTimeDifferenceInMinutes = (time1: string, time2: string): number => {
  return Math.abs(toMinutes(time1) - toMinutes(time2))
}

/**
 * バスの状態を計算して返します
 */
export const getBusStatus = (
  departureTime: string,
  index: number,
  buses: DisplayBusInfo[],
  now: Date | null
): BusStatus => {
  if (!now) return { status: 'scheduled', text: '時刻計算中...' }

  // シャトル便の場合は特別な処理を行う
  const bus = buses[index]
  if (bus.segmentType === 'shuttle' && bus.shuttleTimeRange) {
    return getShuttleBusStatus(bus, now)
  }

  // 通常便の処理
  return getRegularBusStatus(departureTime, index, buses, now)
}

/**
 * シャトル便の状態を計算
 */
const getShuttleBusStatus = (bus: DisplayBusInfo, now: Date): BusStatus => {
  if (!bus.shuttleTimeRange) {
    return { status: 'scheduled', text: '' }
  }

  // バスの日付が今日でない場合は状態を表示しない
  const today = format(now, 'yyyy-MM-dd')
  if (bus.date !== today) {
    return { status: 'scheduled', text: '' }
  }

  // 現在時刻をシャトル便の運行時間と比較
  const nowStr = format(now, 'HH:mm')
  const startTime = bus.shuttleTimeRange.startTime
  const endTime = bus.shuttleTimeRange.endTime

  // 現在時刻がシャトル運行時間内かチェック
  const isAfterStart = isTimeAfterOrEqual(nowStr, startTime)
  const isBeforeEnd = isTimeBeforeOrEqual(nowStr, endTime)

  if (isAfterStart && isBeforeEnd) {
    // 運行中の場合、間隔情報も表示
    return { status: 'imminent', text: '運行中' }
  } else if (isTimeBeforeOrEqual(nowStr, startTime)) {
    // シャトル運行開始前
    const diffMinutes = getTimeDifferenceInMinutes(nowStr, startTime)
    if (diffMinutes < 15) {
      return { status: 'soon', text: `開始まで${diffMinutes}分` }
    } else if (diffMinutes < 60) {
      return { status: 'scheduled', text: `開始まで${diffMinutes}分` }
    }
    return { status: 'scheduled', text: '' }
  } else {
    // シャトル運行終了後
    return { status: 'departed', text: '運行終了' }
  }
}

/**
 * 通常便の状態を計算
 */
const getRegularBusStatus = (
  departureTime: string,
  index: number,
  buses: DisplayBusInfo[],
  now: Date
): BusStatus => {
  // バスの日付が今日でない場合は状態を表示しない
  const today = format(now, 'yyyy-MM-dd')
  const bus = buses[index]
  if (bus.date !== today) {
    return { status: 'scheduled', text: '' }
  }

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
    return handleDepartedBusStatus(index, buses, nowTotalMinutes)
  }

  if (adjustedDiffMinutes < 5) return { status: 'imminent', text: 'まもなく出発' }
  if (adjustedDiffMinutes < 15) return { status: 'soon', text: `出発まで${adjustedDiffMinutes}分` }
  if (adjustedDiffMinutes < 60) return { status: 'scheduled', text: `あと${adjustedDiffMinutes}分` }
  return { status: 'scheduled', text: '' } // 1時間以上先は表示しない
}

/**
 * 既に出発したバスの状態を計算
 */
const handleDepartedBusStatus = (
  index: number,
  buses: DisplayBusInfo[],
  nowTotalMinutes: number
): BusStatus => {
  // バスの日付が今日でない場合は状態を表示しない
  const bus = buses[index]
  const today = format(new Date(), 'yyyy-MM-dd')
  if (bus.date !== today) {
    return { status: 'scheduled', text: '' }
  }

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

// --- フィルター関数（グループIDベースでそのまま利用） ---
const applyPreDepartureFilter = (buses: DisplayBusInfo[], now: Date | null): DisplayBusInfo[] => {
  if (!now) return buses
  const nowTimeStr = format(now, 'HH:mm')
  const filtered = buses.filter((bus) => {
    if (bus.segmentType === 'shuttle' && bus.shuttleTimeRange) {
      return isTimeAfterOrEqual(bus.shuttleTimeRange.endTime, nowTimeStr)
    }
    return isTimeAfterOrEqual(bus.departureTime, nowTimeStr)
  })
  return filtered.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))
}

const applyDepartureTimeFilter = (buses: DisplayBusInfo[], startTime: string): DisplayBusInfo[] => {
  const filtered = buses.filter((bus) => {
    if (bus.segmentType === 'shuttle' && bus.shuttleTimeRange) {
      return (
        (isTimeBeforeOrEqual(bus.shuttleTimeRange.startTime, startTime) &&
          isTimeAfterOrEqual(bus.shuttleTimeRange.endTime, startTime)) ||
        isTimeAfterOrEqual(bus.shuttleTimeRange.startTime, startTime)
      )
    }
    return isTimeAfterOrEqual(bus.departureTime, startTime)
  })
  return filtered.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))
}

const applyArrivalTimeFilter = (buses: DisplayBusInfo[], endTime: string): DisplayBusInfo[] => {
  const filtered = buses.filter((bus) => {
    const arrivalTimeToCompare =
      bus.segmentType === 'shuttle' && bus.shuttleTimeRange
        ? bus.shuttleTimeRange.endTime
        : bus.arrivalTime
    if (!arrivalTimeToCompare) return false
    return isTimeBeforeOrEqual(arrivalTimeToCompare, endTime)
  })
  return filtered
}
