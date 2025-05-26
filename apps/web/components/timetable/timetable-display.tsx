import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { components } from '@/generated/oas'
import { DisplayBusInfo } from '@/lib/types/timetable'
import { getBusStatus } from '@/lib/utils/timetable'
import { FaArrowRight, FaClock, FaMapMarkerAlt } from 'react-icons/fa'
import { BusRow } from './bus-row'
import { RouteInfoCard } from './route-info-card'

export interface TimetableDisplayProps {
  selectedDeparture: number | null
  selectedDestination: number | null
  filteredTimetable: DisplayBusInfo[]
  now: Date | null
  timetableData?: components['schemas']['Models.BusStopGroupTimetable'] | null
  isLoading?: boolean // 追加
}

/**
 * 時刻表表示コンポーネント
 * バスの運行情報を表形式で表示する
 */
export function TimetableDisplay({
  selectedDeparture,
  selectedDestination,
  filteredTimetable,
  now,
  timetableData,
  isLoading = false, // デフォルトfalse
}: TimetableDisplayProps) {
  return (
    <Card className="shadow-sm overflow-hidden pt-0 gap-2">
      <CardHeader className="pb-2 pt-4 px-5 bg-muted">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex flex-wrap justify-left items-center gap-0 text-base font-semibold">
            <FaClock className="mr-1 h-3.5 w-3.5" />
            <span className="ml-1">時刻表</span>
            {selectedDeparture != null && timetableData && (
              <div className="flex flex-wrap items-center">
                <span className="font-normal text-sm mx-2">|</span>
                <span>{timetableData.name}</span>
                {selectedDestination != null && timetableData.segments && (
                  <>
                    <FaArrowRight className="h-2.5 w-2.5 text-muted-foreground mx-2" />
                    <span>
                      {
                        timetableData.segments.find(
                          (seg) => seg.destination.stopId === selectedDestination
                        )?.destination.stopName
                      }
                    </span>
                  </>
                )}
              </div>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 ml-auto">
            {selectedDeparture && filteredTimetable.length > 0 && (
              <Badge variant="secondary" className="px-2.5 py-0.5 text-xs">
                {filteredTimetable.length}便
              </Badge>
            )}
            {selectedDeparture &&
              filteredTimetable.some((bus) => bus.segmentType === 'shuttle') && (
                <Badge
                  variant="default"
                  className="px-2.5 py-0.5 text-xs border-purple-400 dark:border-purple-600 bg-purple-700 dark:bg-purple-600 text-white"
                >
                  シャトル {filteredTimetable.filter((bus) => bus.segmentType === 'shuttle').length}
                  便
                </Badge>
              )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!selectedDeparture ? (
          <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FaMapMarkerAlt className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="mt-2 text-base font-medium">出発地を選択してください</h3>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs">
              出発地を選択すると、利用可能な時刻表が表示されます。
            </p>
          </div>
        ) : isLoading ? (
          <div className="py-10 px-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium pl-4 md:pl-6">目的地</TableHead>
                  <TableHead className="text-xs font-medium">出発時刻</TableHead>
                  <TableHead className="text-xs font-medium hidden md:table-cell">到着時刻</TableHead>
                  <TableHead className="text-right text-xs font-medium"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <td className="pl-4 md:pl-6 py-2"><Skeleton className="h-6 w-24 rounded" /></td>
                    <td className="py-2"><Skeleton className="h-6 w-20 rounded" /></td>
                    <td className="py-2 hidden md:table-cell"><Skeleton className="h-6 w-20 rounded" /></td>
                    <td className="py-2 text-right"><Skeleton className="h-6 w-8 rounded ml-auto" /></td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : filteredTimetable.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FaClock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-2 text-base font-medium">Not Found</h3>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs">
              選択された条件に一致するバスが見つかりませんでした。
            </p>
          </div>
        ) : (
          <>
            {/* 経路情報があれば表示 */}
            {selectedDeparture && selectedDestination && timetableData && (
              <div className="px-4 pt-3">
                <RouteInfoCard
                  timetableData={timetableData}
                  selectedDeparture={selectedDeparture}
                  selectedDestination={selectedDestination}
                  busStopGroups={[]}
                  isLoading={isLoading}
                />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium pl-4 md:pl-6">目的地</TableHead>
                  <TableHead className="text-xs font-medium">出発時刻</TableHead>
                  <TableHead className="text-xs font-medium hidden md:table-cell">
                    到着時刻
                  </TableHead>
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
      </CardContent>
    </Card>
  )
}
