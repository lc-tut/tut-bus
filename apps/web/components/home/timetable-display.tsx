'use client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { components } from '@/generated/oas'
import { DisplayBusInfo } from '@/lib/types/timetable'
import { getBusStatus } from '@/lib/utils/timetable'
import { useEffect, useState } from 'react'
import { FaArrowRight, FaClock, FaMapMarkerAlt } from 'react-icons/fa'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { BusRow } from './bus-row'
import { ShortBusRow } from './short-bus-row'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export interface TimetableDisplayProps {
  selectedDeparture: number | null
  selectedDestination: number | null
  filteredShortTimetable: DisplayBusInfo[]
  filteredTimetable: DisplayBusInfo[]
  allBuses: DisplayBusInfo[]
  arriveTimetable: DisplayBusInfo[]

  now: Date | null
  busStopGroups: components['schemas']['Models.BusStopGroup'][]
}

export function TimetableDisplay({
  selectedDeparture,
  selectedDestination,
  filteredShortTimetable,
  filteredTimetable,
  allBuses,
  now,
  busStopGroups,
}: TimetableDisplayProps) {
  const isDesktop = useIsDesktop()

  // 時刻表から利用可能な目的地を抽出
  const availableDestinations = Array.from(
    new Set(filteredShortTimetable.map((bus) => bus.destination.stopId))
  )

  // 目的地が選択されていないが、利用可能な目的地が1つだけの場合は自動選択
  const effectiveDestination =
    selectedDestination ||
    (availableDestinations.length === 1 ? parseInt(availableDestinations[0], 10) : null)

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  // PC: すべての便（目的地フィルタ済み）、モバイル: 以降の便
  const desktopBuses = allBuses
    .slice()
    .sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))
  const mobileBuses = filteredTimetable
    .slice()
    .sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))

  const makeFullTable = (buses: DisplayBusInfo[]) => (
    <div className="relative w-full">
      <table className="w-full caption-bottom text-sm">
        <thead className="bg-background sticky top-0 z-10 shadow-[inset_0_-1px_0_var(--color-border)]">
          <tr className="transition-colors">
            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-xs pl-4 md:pl-6">目的地</th>
            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-xs">出発時刻</th>
            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-xs hidden md:table-cell">到着時刻</th>
            <th className="text-foreground h-10 px-2 text-right align-middle font-medium whitespace-nowrap text-xs"></th>
          </tr>
        </thead>
        <TableBody>
          {buses.map((bus, idx) => {
            const busStatus = getBusStatus(bus.departureTime, idx, buses, now)
            return <BusRow key={idx} bus={bus} busStatus={busStatus} index={idx} />
          })}
        </TableBody>
      </table>
    </div>
  )

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

          {isDesktop ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="mt-2 mx-4"
                  variant="outline"
                  disabled={!selectedDeparture || !effectiveDestination}
                >
                  すべての便を表示
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-2 space-y-3 shrink-0">
                  <DialogTitle>時刻表一覧</DialogTitle>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className="mr-3 bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300 text-xs whitespace-nowrap flex items-center"
                      >
                        <FaMapMarkerAlt className="mr-1 size-3" />
                        出発地
                      </Badge>
                      <span className="font-bold text-sm">
                        {busStopGroups.find((g) => g.id === selectedDeparture)?.name}
                      </span>
                    </div>
                    {effectiveDestination && (
                      <div className="flex items-center">
                        <Badge
                          variant="outline"
                          className="mr-3 bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300 text-xs whitespace-nowrap flex items-center"
                        >
                          <FaArrowRight className="mr-1 size-3" />
                          行先
                        </Badge>
                        <span className="font-bold text-sm">
                          {desktopBuses.find(
                            (bus) => parseInt(bus.destination.stopId, 10) === effectiveDestination
                          )?.destination.stopName}
                        </span>
                      </div>
                    )}
                  </div>
                  <DialogDescription>
                    {now ? `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日` : ''}
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto min-h-0">
                  {makeFullTable(desktopBuses)}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Drawer
              onOpenChange={(open) => {
                if (open) (document.activeElement as HTMLElement)?.blur()
              }}
            >
              <DrawerTrigger asChild>
                <Button
                  className="mt-2 mx-4"
                  variant="outline"
                  disabled={!selectedDeparture || !effectiveDestination}
                >
                  以降の時刻表を表示
                </Button>
              </DrawerTrigger>
              <DrawerContent className="min-h-[400px] max-h-[60vh]">
                <DrawerTitle className="sr-only">時刻表一覧</DrawerTitle>
                <DrawerDescription className="sr-only">
                  すべての時刻表データを表示します
                </DrawerDescription>
                {makeFullTable(mobileBuses)}
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="default" className="p-5 font-bold">
                      閉じる
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
        </>
      )}
    </div>
  )
}
