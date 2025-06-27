import { DisplayBusInfo } from '@/lib/types/timetable'

export function filterBusesByDeparture(buses: DisplayBusInfo[], now: Date): DisplayBusInfo[] {
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const toMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  // 現在時刻でバスを2つに分ける
  const pastBuses = buses
    .filter((bus) => toMinutes(bus.departureTime) < currentMinutes)
    .sort((a, b) => toMinutes(b.departureTime) - toMinutes(a.departureTime)) // 降順にソート

  const upcomingBuses = buses
    .filter((bus) => toMinutes(bus.departureTime) >= currentMinutes)
    .sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime)) // 昇順にソート

  // 一本前のバスと次の3本のバスを合わせる
  const previousBus = pastBuses.length > 0 ? [pastBuses[0]] : []

  let nextBuses: DisplayBusInfo[]
  if (previousBus.length === 0) {
    nextBuses = upcomingBuses.slice(0, 3)
  } else {
    nextBuses = upcomingBuses.slice(0, 2)
  }

  // 一本前のバスを先頭に、その後に次の5本のバスを配置
  return [...previousBus, ...nextBuses]
}

export function filterBusesByDestination(
  buses: DisplayBusInfo[],
  destinationId: number | null
): DisplayBusInfo[] {
  if (!destinationId) return buses

  return buses.filter((bus) => parseInt(bus.destination.stopId, 10) === destinationId)
}
