import { format } from 'date-fns'
import { busStopsInfo, sampleSchedule } from '../data/timetable'
import { BusStatus, DisplayBusInfo, ScheduleForDate, SegmentForDate, StopInfo } from '../types/timetable'

/**
 * 時刻表データから表示用バスデータを生成します
 */
export const generateDisplayBuses = (
  selectedDeparture: string,
  selectedDestination: string,
  selectedDate: Date | null
): DisplayBusInfo[] => {
  const displayBuses: DisplayBusInfo[] = []
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
        // 固定時刻バス処理
        addFixedSegmentBuses(segment, schedule, displayBuses)
      } else if (segment.segmentType === 'frequency') {
        // 頻度ベースバス処理
        addFrequencySegmentBuses(segment, schedule, displayBuses)
      } else if (segment.segmentType === 'shuttle') {
        // シャトル便処理
        addShuttleSegmentBus(segment, schedule, displayBuses)
      }
    }
  }

  // 時間でソート
  displayBuses.sort((a, b) => a.departureTime.localeCompare(b.departureTime))

  // 始発・最終バスを設定
  setFirstAndLastBuses(displayBuses)

  return displayBuses
}

/**
 * 固定時刻バスをリストに追加
 */
const addFixedSegmentBuses = (
  segment: SegmentForDate, 
  schedule: ScheduleForDate, 
  displayBuses: DisplayBusInfo[]
): void => {
  if (segment.segmentType !== 'fixed') return
  
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
}

/**
 * 頻度ベースバスをリストに追加
 */
const addFrequencySegmentBuses = (
  segment: SegmentForDate, 
  schedule: ScheduleForDate, 
  displayBuses: DisplayBusInfo[]
): void => {
  if (segment.segmentType !== 'frequency') return
  
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
    const departureTime = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`

    // 到着時間を計算（20分後と仮定）
    const arrivalTimeMinutes = timeMinutes + 20
    const arrivalHours = Math.floor(arrivalTimeMinutes / 60)
    const arrivalMinutes = arrivalTimeMinutes % 60
    const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes
      .toString()
      .padStart(2, '0')}`

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
}

/**
 * シャトル便をリストに追加
 */
const addShuttleSegmentBus = (
  segment: SegmentForDate, 
  schedule: ScheduleForDate, 
  displayBuses: DisplayBusInfo[]
): void => {
  if (segment.segmentType !== 'shuttle') return
  
  const startTimeMinutes =
    parseInt(segment.startTime.split(':')[0]) * 60 +
    parseInt(segment.startTime.split(':')[1])

  // 到着時間を計算（平均移動時間を加算）
  const travelTimeMinutes = 20 // 平均移動時間（分）
  const arrivalTimeMinutes = startTimeMinutes + travelTimeMinutes
  const arrivalHours = Math.floor(arrivalTimeMinutes / 60)
  const arrivalMinutes = arrivalTimeMinutes % 60
  const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes
    .toString()
    .padStart(2, '0')}`

  displayBuses.push({
    departureTime: segment.startTime,
    arrivalTime: arrivalTime, // 開始時刻直後に出発するバスの到着時間
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

/**
 * 始発・最終バスを設定
 */
const setFirstAndLastBuses = (displayBuses: DisplayBusInfo[]): void => {
  if (displayBuses.length === 0) return
  
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

/**
 * 日付と出発地、目的地などの条件に基づいてバスの時刻表をフィルタリングします
 */
export const filterTimetable = (
  selectedDeparture: string,
  selectedDestination: string,
  timeFilter: 'all' | 'preDeparture' | 'departure' | 'arrival',
  startTime: string,
  endTime: string,
  selectedDate: Date | null,
  now: Date | null
): DisplayBusInfo[] => {
  // 基本のバスデータを生成
  let displayBuses = generateDisplayBuses(selectedDeparture, selectedDestination, selectedDate)
  
  // 各種フィルターを適用
  if (timeFilter === 'all') {
    // フィルターなし - すべてのバスを表示
    // 出発時間順にソート
    displayBuses.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
  } else if (timeFilter === 'preDeparture') {
    // 出発前のバスをフィルター
    displayBuses = applyPreDepartureFilter(displayBuses, now)
    // 出発時間順にソート
    displayBuses.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
  } else if (timeFilter === 'departure') {
    // 指定出発時間以降のバスをフィルター
    displayBuses = applyDepartureTimeFilter(displayBuses, startTime)
    // 出発時間順にソート
    displayBuses.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
  } else if (timeFilter === 'arrival') {
    // 指定到着時間までのバスをフィルター
    displayBuses = applyArrivalTimeFilter(displayBuses, endTime, now)
    // この場合は特別なソート順を適用（関数内で実施済み）
    return displayBuses // arrival フィルタの場合は早期リターン
  }
  
  return displayBuses
}

/**
 * 出発前のバスのみフィルタリングする
 */
const applyPreDepartureFilter = (
  buses: DisplayBusInfo[], 
  now: Date | null
): DisplayBusInfo[] => {
  if (!now) return buses
  
  // 現在時刻以降のバスをフィルタリング
  const nowTimeStr = format(now, 'HH:mm')
  
  return buses.filter((bus) => {
    if (bus.segmentType === 'shuttle' && bus.shuttleTimeRange) {
      // シャトル便の場合、運行終了時刻が現在時刻以降であれば表示
      return isTimeAfterOrEqual(bus.shuttleTimeRange.endTime, nowTimeStr)
    }
    // 通常便の場合は出発時間で判断
    return isTimeAfterOrEqual(bus.departureTime, nowTimeStr)
  })
}

/**
 * 指定出発時間以降のバスをフィルタリングする
 */
const applyDepartureTimeFilter = (
  buses: DisplayBusInfo[], 
  startTime: string
): DisplayBusInfo[] => {
  return buses.filter((bus) => {
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
}

/**
 * 指定到着時間までのバスをフィルタリングする
 */
const applyArrivalTimeFilter = (
  buses: DisplayBusInfo[], 
  endTime: string, 
  now: Date | null
): DisplayBusInfo[] => {
  // 到着時間フィルターを適用
  const filteredBuses = buses.filter((bus) => {
    if (bus.segmentType === 'shuttle' && bus.shuttleTimeRange) {
      // シャトル便の場合、運行時間のどこかで指定時間までに到着できるか判断
      // 運行終了時刻に間隔の最大値と移動時間を加えた時間が指定時間以前かチェック
      const endTimeMins = parseInt(bus.shuttleTimeRange.endTime.split(':')[0]) * 60 +
                        parseInt(bus.shuttleTimeRange.endTime.split(':')[1])
      const maxInterval = bus.shuttleTimeRange.intervalRange.max
      const travelTime = 20 // 平均移動時間（分）
      
      const lastPossibleArrivalMins = endTimeMins + maxInterval + travelTime
      const lastPossibleArrivalHrs = Math.floor(lastPossibleArrivalMins / 60) % 24
      const lastPossibleArrivalMins2 = lastPossibleArrivalMins % 60
      const lastPossibleArrival = `${lastPossibleArrivalHrs.toString().padStart(2, '0')}:${lastPossibleArrivalMins2.toString().padStart(2, '0')}`
      
      return isTimeBeforeOrEqual(bus.arrivalTime, endTime) || isTimeBeforeOrEqual(lastPossibleArrival, endTime)
    }
    return isTimeBeforeOrEqual(bus.arrivalTime, endTime)
  })
  
  // 現在時刻がある場合は、現在時刻との差が小さい順にソート
  if (now) {
    const nowStr = format(now, 'HH:mm')
    const nowHours = parseInt(nowStr.split(':')[0])
    const nowMinutes = parseInt(nowStr.split(':')[1])
    const nowTotalMinutes = nowHours * 60 + nowMinutes
    
    // 各バスの到着時刻と現在時刻の差を計算してソート
    return filteredBuses.sort((a, b) => {
      // a の到着時間を分換算
      const aHours = parseInt(a.arrivalTime.split(':')[0])
      const aMinutes = parseInt(a.arrivalTime.split(':')[1])
      const aTotalMinutes = aHours * 60 + aMinutes
      
      // b の到着時間を分換算
      const bHours = parseInt(b.arrivalTime.split(':')[0])
      const bMinutes = parseInt(b.arrivalTime.split(':')[1])
      const bTotalMinutes = bHours * 60 + bMinutes
      
      // 現在時刻との差（絶対値）を計算
      const aDiff = Math.abs(aTotalMinutes - nowTotalMinutes)
      const bDiff = Math.abs(bTotalMinutes - nowTotalMinutes)
      
      // 差が小さい順にソート
      return aDiff - bDiff
    })
  } else {
    // 現在時刻がない場合は到着時間順
    return filteredBuses.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime))
  }
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
  if (adjustedDiffMinutes < 15)
    return { status: 'soon', text: `出発まで${adjustedDiffMinutes}分` }
  if (adjustedDiffMinutes < 60)
    return { status: 'scheduled', text: `あと${adjustedDiffMinutes}分` }
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
export const getAvailableDestinations = (selectedDeparture: string): StopInfo[] => {
  // 出発地を除外した目的地のリストを返す
  if (!selectedDeparture) return busStopsInfo
  // 出発地として選択された停留所を除外
  return busStopsInfo.filter((stop) => stop.id !== selectedDeparture)
}

/**
 * 目的地に基づいて利用可能な出発地のリストを返します
 */
export const getAvailableDepartures = (selectedDestination: string): StopInfo[] => {
  // 目的地が選択されていない場合はすべての出発地を返す
  // 目的地と同じ出発地は選べないようにする
  if (!selectedDestination) return busStopsInfo
  return busStopsInfo.filter((stop) => stop.id !== selectedDestination)
}

/**
 * 出発地と目的地の組み合わせに基づいてシャトル便セグメントを取得します
 */
export const getShuttleSegments = (
  selectedDeparture: string,
  selectedDestination: string
): SegmentForDate[] => {
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

  return shuttleSegments
}

/**
 * 出発地と目的地を入れ替えるが、可能な場合にのみ入れ替える
 */
export const canSwapStations = (
  selectedDeparture: string,
  selectedDestination: string
): boolean => {
  if (!selectedDeparture || !selectedDestination) return false

  return sampleSchedule.some((schedule) => {
    return (
      schedule.departure.stopId === selectedDestination &&
      schedule.segments.some((segment) => segment.destination.stopId === selectedDeparture)
    )
  })
}

/**
 * 時間文字列（HH:mm）が他の時間文字列より後かどうかを判定します
 */
export const isTimeAfterOrEqual = (time1: string, time2: string): boolean => {
  const [hours1, minutes1] = time1.split(':').map(Number)
  const [hours2, minutes2] = time2.split(':').map(Number)
  
  const totalMinutes1 = hours1 * 60 + minutes1
  const totalMinutes2 = hours2 * 60 + minutes2
  
  return totalMinutes1 >= totalMinutes2
}

/**
 * 時間文字列（HH:mm）が他の時間文字列より前かどうかを判定します
 */
export const isTimeBeforeOrEqual = (time1: string, time2: string): boolean => {
  const [hours1, minutes1] = time1.split(':').map(Number)
  const [hours2, minutes2] = time2.split(':').map(Number)
  
  const totalMinutes1 = hours1 * 60 + minutes1
  const totalMinutes2 = hours2 * 60 + minutes2
  
  return totalMinutes1 <= totalMinutes2
}

/**
 * 2つの時間文字列（HH:mm）の差分を分単位で返します
 */
export const getTimeDifferenceInMinutes = (time1: string, time2: string): number => {
  const [hours1, minutes1] = time1.split(':').map(Number)
  const [hours2, minutes2] = time2.split(':').map(Number)
  
  const totalMinutes1 = hours1 * 60 + minutes1
  const totalMinutes2 = hours2 * 60 + minutes2
  
  let diff = totalMinutes2 - totalMinutes1
  
  // 日をまたぐ場合の調整
  if (diff < -720) {
    diff += 1440 // 24時間分を加算
  } else if (diff > 720) {
    diff -= 1440 // 24時間分を減算
  }
  
  return Math.abs(diff)
}
