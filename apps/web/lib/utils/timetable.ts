import { format } from 'date-fns'
import { BusStatus, DisplayBusInfo, StopInfo, TimeFilterType } from '../types/timetable'
import type { components } from '@/generated/oas'

/**
 * 時刻表データから表示用バスデータを生成します
 */
export const generateDisplayBuses = (
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null,
  selectedDepartureGroupId: number,
  selectedDestinationStopId: number | null // nullを許容するように変更
): DisplayBusInfo[] => {
  const displayBuses: DisplayBusInfo[] = []
  if (!timetableData || !timetableData.segments) return displayBuses

  // APIのデータ構造に合わせて変換
  for (const segment of timetableData.segments) {
    // 目的地フィルタリング（null または空文字列の場合はすべての目的地を表示）
    if (
      selectedDestinationStopId !== null && // nullでない場合のみフィルタリング
      segment.destination.stopId !== undefined &&
      segment.destination.stopId !== null &&
      segment.destination.stopId !== selectedDestinationStopId
    ) {
      continue
    }

    const departureInfo = {
      stopId: timetableData.id.toString(),
      stopName: timetableData.name,
    }

    const destinationInfo = {
      stopId: segment.destination.stopId.toString(),
      stopName: segment.destination.stopName,
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
          isFirstBus: false, // 後でソート後に設定するため初期値はfalse
          isLastBus: false, // 後でソート後に設定するため初期値はfalse
        })
      })
    } else if (
      segment.segmentType === 'shuttle' &&
      segment.startTime &&
      segment.endTime &&
      segment.intervalRange
    ) {
      displayBuses.push({
        departureTime: segment.startTime, // シャトル便の開始時刻を出発時刻とする
        arrivalTime: segment.endTime, // シャトル便の終了時刻を到着時刻とする（仮）
        departure: departureInfo,
        destination: destinationInfo,
        date: timetableData.date,
        segmentType: 'shuttle',
        isFirstBus: false, // 後でソート後に設定するため初期値はfalse
        isLastBus: false, // 後でソート後に設定するため初期値はfalse
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

  // displayBuses.sort((a, b) => a.departureTime.localeCompare(b.departureTime)) // 元のコード
  displayBuses.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))

  // ソート後に目的地ごとにグループ化して、その日全体での最初と最後のバスを特定する
  if (displayBuses.length > 0) {
    // 目的地IDごとにバスをグループ化
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
        // 各目的地ごとの最初と最後を設定
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
  selectedDepartureGroupId: number,
  selectedDestinationStopId: number | null, // nullを許容するように変更
  timeFilter: TimeFilterType,
  startTime: string,
  endTime: string,
  selectedDate: Date | null,
  now: Date | null,
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null // APIからのデータを追加
): DisplayBusInfo[] => {
  let displayBuses = generateDisplayBuses(
    timetableData,
    selectedDepartureGroupId,
    selectedDestinationStopId
  )

  // フィルタリングの前に、まずソートを行う (generateDisplayBusesでソート済みのため、本来は不要だが念のため修正)
  // displayBuses.sort((a, b) => a.departureTime.localeCompare(b.departureTime)) // 元のコード
  displayBuses.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))

  if (timeFilter === 'all') {
    // 'all' の場合は既にソート済みなので何もしない
  } else if (timeFilter === 'preDeparture') {
    displayBuses = applyPreDepartureFilter(displayBuses, now)
    // applyPreDepartureFilter の中でソートされる
  } else if (timeFilter === 'departure') {
    displayBuses = applyDepartureTimeFilter(displayBuses, startTime)
    // applyDepartureTimeFilter の中でソートされる
  } else if (timeFilter === 'arrival') {
    displayBuses = applyArrivalTimeFilter(displayBuses, endTime)
    // 到着時間でフィルタリングした場合、到着時間で逆順にソートする（遅い順に表示）
    displayBuses.sort((a, b) => {
      const arrivalA = a.arrivalTime || a.departureTime // フォールバック
      const arrivalB = b.arrivalTime || b.departureTime // フォールバック
      // 到着時間の降順でソート（遅い → 早い順）
      return toMinutes(arrivalB) - toMinutes(arrivalA)
    })
  }

  // フィルタリング後も、元の isFirstBus と isLastBus の設定を維持する
  // フィルタリングでは isFirstBus と isLastBus の状態を変更しない

  return displayBuses
}

/**
 * 出発前のバスのみフィルタリングする
 */
const applyPreDepartureFilter = (buses: DisplayBusInfo[], now: Date | null): DisplayBusInfo[] => {
  if (!now) return buses

  // 現在時刻以降のバスをフィルタリング
  const nowTimeStr = format(now, 'HH:mm')

  const filtered = buses.filter((bus) => {
    if (bus.segmentType === 'shuttle' && bus.shuttleTimeRange) {
      // シャトル便の場合、運行終了時刻が現在時刻以降であれば表示
      return isTimeAfterOrEqual(bus.shuttleTimeRange.endTime, nowTimeStr)
    }
    // 通常便の場合は出発時間で判断
    return isTimeAfterOrEqual(bus.departureTime, nowTimeStr)
  })
  // フィルタリング後もソート順を維持、または再ソート
  // return filtered.sort((a,b) => a.departureTime.localeCompare(b.departureTime)); // 元のコード
  return filtered.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))
}

/**
 * 指定出発時間以降のバスをフィルタリングする
 */
const applyDepartureTimeFilter = (buses: DisplayBusInfo[], startTime: string): DisplayBusInfo[] => {
  const filtered = buses.filter((bus) => {
    if (bus.segmentType === 'shuttle' && bus.shuttleTimeRange) {
      // シャトル便の場合、指定された開始時間が運行時間内に含まれているか、
      // または運行開始時間が指定時間以降なら表示
      return (
        (isTimeBeforeOrEqual(bus.shuttleTimeRange.startTime, startTime) &&
          isTimeAfterOrEqual(bus.shuttleTimeRange.endTime, startTime)) ||
        isTimeAfterOrEqual(bus.shuttleTimeRange.startTime, startTime)
      )
    }
    return isTimeAfterOrEqual(bus.departureTime, startTime)
  })
  // フィルタリング後もソート順を維持、または再ソート
  // return filtered.sort((a,b) => a.departureTime.localeCompare(b.departureTime)); // 元のコード
  return filtered.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))
}

/**
 * 指定到着時間以前のバスをフィルタリングする
 */
const applyArrivalTimeFilter = (buses: DisplayBusInfo[], endTime: string): DisplayBusInfo[] => {
  const filtered = buses.filter((bus) => {
    // シャトル便の場合、arrivalTime が存在しない可能性があるため、shuttleTimeRange.endTime を使用
    const arrivalTimeToCompare =
      bus.segmentType === 'shuttle' && bus.shuttleTimeRange
        ? bus.shuttleTimeRange.endTime
        : bus.arrivalTime
    if (!arrivalTimeToCompare) return false // 到着時刻がない場合はフィルタリング対象外
    return isTimeBeforeOrEqual(arrivalTimeToCompare, endTime)
  })

  // filterTimetable関数内でソートするため、ここではソートせずにフィルタリングしたリストをそのまま返す
  return filtered
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

/**
 * 出発地に基づいて利用可能な目的地のリストを返します
 */
export const getAvailableDestinations = (
  selectedDeparture: number,
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null
): StopInfo[] => {
  if (!timetableData || !timetableData.segments) return []
  // 出発地を除外した目的地のリストを返す
  if (!selectedDeparture) {
    return timetableData.segments.map((segment) => ({
      id: segment.destination.stopId,
      name: segment.destination.stopName,
      // available: true, // StopInfoに存在しないためコメントアウト
    }))
  }
  // 出発地として選択された停留所を除外
  return timetableData.segments
    .filter((segment) => segment.destination.stopId !== selectedDeparture)
    .map((segment) => ({
      id: segment.destination.stopId,
      name: segment.destination.stopName,
      // available: true, // StopInfoに存在しないためコメントアウト
    }))
}

/**
 * 目的地に基づいて利用可能な出発地のリストを返します
 */
export const getAvailableDepartures = (
  selectedDestination: number,
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null
): StopInfo[] => {
  if (!timetableData) return []
  // 目的地が選択されていない場合はすべての出発地を返す
  // 目的地と同じ出発地は選べないようにする
  const departures: StopInfo[] = [
    {
      id: timetableData.id,
      name: timetableData.name,
      // available: true, // StopInfoに存在しないためコメントアウト
    },
  ]
  if (!selectedDestination) return departures
  return departures.filter((dep) => dep.id !== selectedDestination)
}

/**
 * 出発地と目的地を入れ替えるが、可能な場合にのみ入れ替える
 */
export const canSwapStations = (
  selectedDeparture: number,
  selectedDestination: number,
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null
): boolean => {
  if (!selectedDeparture || !selectedDestination || !timetableData || !timetableData.segments)
    return false

  const departureExistsAsDestination = timetableData.segments.some(
    (segment) => segment.destination.stopId === selectedDeparture
  )
  // timetableData.id が selectedDestination と一致するかどうかで判定
  const destinationExistsAsDeparture = timetableData.id === selectedDestination

  return departureExistsAsDestination && destinationExistsAsDeparture
}

/**
 * シャトル便のセグメントを取得
 * timetableData, selectedDeparture, selectedDestination を元にシャトル便のみ抽出
 */
export const getShuttleSegments = (
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null,
  selectedDeparture: number,
  selectedDestination: number
): DisplayBusInfo[] => {
  return generateDisplayBuses(timetableData, selectedDeparture, selectedDestination).filter(
    (bus) => bus.segmentType === 'shuttle'
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
