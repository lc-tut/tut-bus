import { components } from '@/generated/oas'
import { DisplayBusInfo } from '@/lib/types/timetable'

export function extractDestinations(
  groupTimetable:
    | {
        filtered: DisplayBusInfo[]
        raw: components['schemas']['Models.BusStopGroupTimetable']
        allBuses: DisplayBusInfo[]
      }
    | undefined
): { stopId: number; stopName: string }[] {
  const uniqueDestinations = new Map<number, { stopId: number; stopName: string }>()

  // まず設定されているすべての経路を raw.segments から取得
  groupTimetable?.raw?.segments?.forEach((segment) => {
    if (segment?.destination?.stopId && segment?.destination?.stopName) {
      const stopId = segment.destination.stopId
      uniqueDestinations.set(stopId, {
        stopId: stopId,
        stopName: segment.destination.stopName,
      })
    }
  })

  // 実際の運行バスからも追加（重複は Map で自動的に排除される）
  groupTimetable?.allBuses?.forEach((bus) => {
    if (bus?.destination?.stopId && bus?.destination?.stopName) {
      const stopId = parseInt(bus.destination.stopId, 10)
      uniqueDestinations.set(stopId, {
        stopId: stopId,
        stopName: bus.destination.stopName,
      })
    }
  })

  return Array.from(uniqueDestinations.values())
}
