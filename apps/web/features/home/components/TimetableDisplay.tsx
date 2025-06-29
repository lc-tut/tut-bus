import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { components } from '@/generated/oas'
import { DisplayBusInfo } from '@/lib/types/timetable'
import { getBusStatus } from '@/lib/utils/timetable'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { FaClock, FaMapMarkerAlt } from 'react-icons/fa'
import { Button } from '../../../components/ui/button'
import { HomeBusRow } from './HomeBusRow'

export interface TimetableDisplayProps {
  selectedDeparture: number | null
  selectedDestination: number | null
  filteredTimetable: DisplayBusInfo[]
  now: Date | null
  busStopGroups: components['schemas']['Models.BusStopGroup'][]
}

export function TimetableDisplay({
  selectedDeparture,
  selectedDestination,
  filteredTimetable,
  now,
  busStopGroups,
}: TimetableDisplayProps) {
  const router = useRouter()

  // 時刻表から利用可能な目的地を抽出
  const availableDestinations = Array.from(
    new Set(filteredTimetable.map((bus) => bus.destination.stopId))
  )

  const effectiveDestination =
    selectedDestination ||
    (availableDestinations.length === 1 ? parseInt(availableDestinations[0], 10) : null)

  const findGroupIdByStopId = (stopId: number): number | null => {
    for (const group of busStopGroups) {
      if (group.busStops.some((stop) => stop.id === stopId)) {
        return group.id
      }
    }
    return null
  }

  const handleViewFullTimetable = () => {
    if (!selectedDeparture || !effectiveDestination || !now) return

    // stopIdからgroupIdを見つける
    const destinationGroupId = findGroupIdByStopId(effectiveDestination)
    if (!destinationGroupId) {
      console.error('Could not find group ID for stop ID:', effectiveDestination)
      return
    }

    const params = new URLSearchParams({
      from: selectedDeparture.toString(),
      to: destinationGroupId.toString(),
      date: format(now, 'yyyy-MM-dd'),
    })

    router.push(`/timetable?${params.toString()}`)
  }
  return (
    <div className="flex-1 flex flex-col min-h-[210px] justify-between">
      {!selectedDeparture ? (
        <div className="flex flex-col items-center justify-center py-14 px-5 text-center flex-1">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FaMapMarkerAlt className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="mt-2 text-base font-medium">出発地を選択してください</h3>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs">
            出発地を選択すると、利用可能な時刻表が表示されます。
          </p>
        </div>
      ) : !effectiveDestination ? (
        <div className="flex flex-col items-center justify-center py-14 px-5 text-center flex-1">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FaMapMarkerAlt className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="mt-2 text-base font-medium">目的地を選択してください</h3>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs">
            目的地を選択すると、時刻表が表示されます。
          </p>
        </div>
      ) : filteredTimetable.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-5 text-center flex-1">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FaClock className="size-16 text-muted-foreground" />
          </div>
          <h3 className="mt-1 text-foreground font-medium">今日の運行はありません。</h3>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium pl-4 md:pl-6">目的地</TableHead>
                <TableHead className="text-xs font-medium">出発時刻</TableHead>
                <TableHead className="text-right text-xs font-medium "></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimetable.map((bus, idx) => {
                const busStatus = getBusStatus(bus.departureTime, idx, filteredTimetable, now)
                return <HomeBusRow key={idx} bus={bus} busStatus={busStatus} index={idx} />
              })}
            </TableBody>
          </Table>
          <Button
            className="mt-2 mb-4 mx-4"
            variant={'default'}
            onClick={handleViewFullTimetable}
            disabled={!selectedDeparture || !effectiveDestination}
          >
            以降の時刻表を表示
          </Button>
        </>
      )}
    </div>
  )
}
