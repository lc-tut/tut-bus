// filepath: /home/hekuta/works/tut-bus/apps/web/components/timetable/bus-row.tsx
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import { BusStatus, DisplayBusInfo } from '@/lib/types/timetable'

interface BusRowProps {
  bus: DisplayBusInfo
  busStatus: BusStatus
  index: number
}

export function BusRow({ bus, busStatus, index }: BusRowProps) {
  return (
    <TableRow
      key={index}
      className={cn(
        'hover:bg-muted/50 text-base py-1.5 font-semibold',
        bus.segmentType === 'shuttle'
          ? 'bg-purple-50/80 dark:bg-purple-950/30'
          : busStatus.status === 'departed'
            ? 'bg-muted/50 dark:bg-foreground/5 border-l-2 border-b-0 border-muted-foreground/50 text-muted-foreground'
            : busStatus.status === 'imminent'
              ? 'bg-red-200/80 dark:bg-red-900/30 border-l-2 border-b-0 border-red-500 dark:border-red-600'
              : busStatus.status === 'soon'
                ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 border-l-2 border-b-0 px-2'
                : undefined
      )}
    >
      <TableCell
        className={cn(
          bus.segmentType === 'shuttle' &&
          'bg-purple-100/40 dark:bg-purple-900/40 border-l-2 border-purple-500 dark:border-purple-600',
          busStatus.status === 'departed' && 'line-through'
        )}
      >
        <div className="flex items-center gap-1.5 pl-2 md:pl-4">
          <span
            className={
              bus.segmentType === 'shuttle'
                ? 'font-medium text-purple-700 dark:text-purple-300'
                : ''
            }
          >
            {bus.destination.stopName}
          </span>
        </div>
      </TableCell>

      <TableCell
        className={cn(
          bus.segmentType === 'shuttle' && 'bg-purple-100/40 dark:bg-purple-900/40',
          busStatus.status === 'departed' && 'line-through'
        )}
      >
        {bus.segmentType === 'shuttle' && bus.shuttleTimeRange ? (
          <div className="flex items-start flex-col sm:flex-row">
            {bus.shuttleTimeRange.startTime}&nbsp;~&nbsp;{bus.shuttleTimeRange.endTime}
          </div>
        ) : (
          <span>{bus.departureTime}</span>
        )}
      </TableCell>
      <TableCell
        className={cn(
          'hidden md:table-cell',
          bus.segmentType === 'shuttle' && 'bg-purple-100/40 dark:bg-purple-900/40'
        )}
      >
        {bus.segmentType === 'shuttle' && bus.shuttleTimeRange ? (
          <></>
        ) : (
          <span>{bus.arrivalTime}</span>
        )}
      </TableCell>
      <TableCell
        className={cn(
          'text-right',
          bus.segmentType === 'shuttle' && 'bg-purple-100/40 dark:bg-purple-900/40'
        )}
      >
        <div className="flex items-center justify-end gap-1.5">
          {/* シャトル便と通常のバスで表示内容を分ける */}
          {bus.segmentType === 'shuttle' ? (
            <div className="flex items-center gap-1.5">
              {/* シャトル便の場合は運行状態を表示 */}
              {busStatus.text && (
                <span
                  className={cn(
                    'text-xs font-medium pr-3',
                    busStatus.status === 'departed'
                      ? 'text-muted-foreground'
                      : busStatus.status === 'imminent'
                        ? 'text-purple-500 dark:text-purple-300 font-bold'
                        : busStatus.status === 'soon'
                          ? 'text-blue-500 dark:text-blue-300'
                          : 'text-foreground'
                  )}
                >
                  {busStatus.text}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* 状態テキストを先に表示 */}
              <span
                className={cn(
                  'text-xs font-medium pr-3',
                  busStatus.status === 'departed'
                    ? 'text-muted-foreground'
                    : busStatus.status === 'imminent'
                      ? 'text-red-500 dark:text-red-400'
                      : busStatus.status === 'soon'
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-foreground'
                )}
              >
                {busStatus.text}
              </span>
              {/* 始発バッジ */}
              {bus.isFirstBus && (
                <Badge
                  variant="default"
                  className="font-semibold bg-blue-400 dark:bg-blue-600 text-white"
                >
                  始
                </Badge>
              )}

              {/* 最終便バッジ */}
              {bus.isLastBus && (
                <Badge
                  variant="default"
                  className="font-semibold bg-red-400 dark:bg-red-600 text-white"
                >
                  終
                </Badge>
              )}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
