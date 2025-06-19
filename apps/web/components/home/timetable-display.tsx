import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DisplayBusInfo } from '@/lib/types/timetable'
import { getBusStatus } from '@/lib/utils/timetable'
import { FaClock, FaMapMarkerAlt } from 'react-icons/fa'
import { BusRow } from '../home/bus-row'

export interface TimetableDisplayProps {
  selectedDeparture: number | null
  filteredTimetable: DisplayBusInfo[]
  now: Date | null
}

export function TimetableDisplay({
  selectedDeparture,
  filteredTimetable,
  now,
}: TimetableDisplayProps) {
  return (
    <div className="flex-1 flex flex-col">
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
                return <BusRow key={idx} bus={bus} busStatus={busStatus} index={idx} />
              })}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  )
}
