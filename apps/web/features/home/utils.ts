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

  groupTimetable?.allBuses?.forEach((bus) => {
    if (bus?.destination?.stopId && bus?.destination?.stopName) {
      const stopId = parseInt(bus.destination.stopId, 10)
      uniqueDestinations.set(stopId, {
        stopId: stopId,
        stopName: bus.destination.stopName,
      })
    }
  })

  if (uniqueDestinations.size === 0) {
    groupTimetable?.raw?.segments?.forEach((segment) => {
      if (segment?.destination?.stopId && segment?.destination?.stopName) {
        const stopId = segment.destination.stopId
        uniqueDestinations.set(stopId, {
          stopId: stopId,
          stopName: segment.destination.stopName,
        })
      }
    })
  }

  return Array.from(uniqueDestinations.values())
}
