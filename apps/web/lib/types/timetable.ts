// バス停情報
export interface StopInfo {
  id: number
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

// バスの状態情報
export interface BusStatus {
  status: 'scheduled' | 'imminent' | 'soon' | 'departed'
  text: string
}

// フィルタータイプ
export type TimeFilterType = 'all' | 'preDeparture' | 'departure' | 'arrival'
