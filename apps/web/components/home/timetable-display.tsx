'use client'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { components } from '@/generated/oas'
import { DisplayBusInfo } from '@/lib/types/timetable'
import { getBusStatus } from '@/lib/utils/timetable'
import { FaClock, FaMapMarkerAlt } from 'react-icons/fa'
import { Button } from '../ui/button'
import { BusRow } from './bus-row'
import { ShortBusRow } from './short-bus-row'

export interface TimetableDisplayProps {
  selectedDeparture: number | null
  selectedDestination: number | null
  filteredShortTimetable: DisplayBusInfo[]
  filteredTimetable: DisplayBusInfo[]
  arriveTimetable: DisplayBusInfo[]

  now: Date | null
  busStopGroups: components['schemas']['Models.BusStopGroup'][]
}

export function TimetableDisplay({
  selectedDeparture,
  selectedDestination,
  filteredShortTimetable,
  filteredTimetable,
  now,
}: TimetableDisplayProps) {
  // 時刻表から利用可能な目的地を抽出
  const availableDestinations = Array.from(
    new Set(filteredShortTimetable.map((bus) => bus.destination.stopId))
  )

  // 目的地が選択されていないが、利用可能な目的地が1つだけの場合は自動選択
  const effectiveDestination =
    selectedDestination ||
    (availableDestinations.length === 1 ? parseInt(availableDestinations[0], 10) : null)

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
      ) : filteredShortTimetable.length === 0 ? (
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
              {filteredShortTimetable.map((bus, idx) => {
                const busStatus = getBusStatus(bus.departureTime, idx, filteredShortTimetable, now)
                return <ShortBusRow key={idx} bus={bus} busStatus={busStatus} index={idx} />
              })}
            </TableBody>
          </Table>
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                className="mt-2 mx-4"
                variant={'outline'}
                disabled={!selectedDeparture || !effectiveDestination}
              >
                以降の時刻表を表示
              </Button>
            </DrawerTrigger>
            <DrawerContent className="min-h-[400px] max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium pl-4 md:pl-6">目的地</TableHead>
                    <TableHead className="text-xs font-medium">出発時刻</TableHead>
                    <TableHead className="text-right text-xs font-medium "></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimetable
                    .sort((a, b) => a.departureTime.localeCompare(b.departureTime))
                    .map((bus, idx) => {
                      const busStatus = getBusStatus(bus.departureTime, idx, filteredTimetable, now)
                      return <BusRow key={idx} bus={bus} busStatus={busStatus} index={idx} />
                    })}
                </TableBody>
              </Table>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="default" className="p-5 font-bold">
                    閉じる
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </div>
  )
}
