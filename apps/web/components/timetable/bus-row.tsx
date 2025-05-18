import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import { BusStatus, DisplayBusInfo } from '@/lib/types/timetable'

interface BusRowProps {
  bus: DisplayBusInfo
  busStatus: BusStatus
  index: number
}

/**
 * バス時刻表の各行を表示するコンポーネント
 */
export function BusRow({ bus, busStatus, index }: BusRowProps) {
  return (
    <TableRow
      key={index}
      className={cn(
        'hover:bg-muted/50',
        busStatus.status === 'imminent'
          ? 'bg-red-200/80 border-l-2 border-b-0 border-red-500'
          : busStatus.status === 'soon'
            ? 'bg-blue-50/80 px-2'
            : bus.segmentType === 'shuttle'
              ? 'bg-purple-50/80'
              : undefined
      )}
    >
      <TableCell
        className={cn(
          'text-sm',
          bus.segmentType === 'shuttle' && 'bg-purple-100/40 border-l-2 border-purple-500'
        )}
      >
        <div className="flex items-center gap-1.5 px-4">
          <span className={bus.segmentType === 'shuttle' ? 'font-medium text-purple-700' : ''}>
            {bus.destination.stopName}
          </span>
        </div>
      </TableCell>

      <TableCell className={cn('font-mono', bus.segmentType === 'shuttle' && 'bg-purple-100/40')}>
        {bus.segmentType === 'shuttle' && bus.shuttleTimeRange ? (
          <div className="flex items-start flex-col sm:flex-row">
            <span className="font-medium text-purple-700 text-xs md:text-sm">
              {bus.shuttleTimeRange.startTime}
            </span>
            <span className="font-medium text-purple-700 text-xs sm:text-sm">
              &nbsp;~&nbsp;{bus.shuttleTimeRange.endTime}
            </span>
          </div>
        ) : (
          <span>{bus.departureTime}</span>
        )}
      </TableCell>
      <TableCell
        className={cn(
          'font-mono hidden md:table-cell',
          bus.segmentType === 'shuttle' && 'bg-purple-100/40'
        )}
      >
        {bus.segmentType === 'shuttle' && bus.shuttleTimeRange ? (
          bus.shuttleTimeRange.intervalRange.min === bus.shuttleTimeRange.intervalRange.max ? (
            <span className="font-medium text-purple-700 text-xs">
              約{bus.shuttleTimeRange.intervalRange.min}分間隔
            </span>
          ) : (
            <span className="font-medium text-purple-700 text-xs">
              約{bus.shuttleTimeRange.intervalRange.min}～{bus.shuttleTimeRange.intervalRange.max}
              分間隔
            </span>
          )
        ) : (
          <span className="font-mono">{bus.arrivalTime}</span>
        )}
      </TableCell>
      <TableCell className={cn('text-right', bus.segmentType === 'shuttle' && 'bg-purple-100/40')}>
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
                        ? 'text-purple-500 font-bold'
                        : busStatus.status === 'soon'
                          ? 'text-blue-500'
                          : 'text-foreground'
                  )}
                >
                  {busStatus.text}
                </span>
              )}

              {/* 始発バッジ */}
              {bus.isFirstBus && (
                <Badge variant="default" className="font-semibold bg-blue-400 text-white">
                  始
                </Badge>
              )}

              {/* 最終便バッジ */}
              {bus.isLastBus && (
                <Badge variant="default" className="font-semibold bg-red-400 text-white">
                  終
                </Badge>
              )}
              <Badge
                variant="default"
                className="md:hidden text-[10px] border-purple-400 bg-purple-700 text-white"
              >
                {bus.shuttleTimeRange &&
                bus.shuttleTimeRange.intervalRange.min === bus.shuttleTimeRange.intervalRange.max
                  ? `約${bus.shuttleTimeRange.intervalRange.min}分間隔`
                  : `約${bus.shuttleTimeRange?.intervalRange.min}～${bus.shuttleTimeRange?.intervalRange.max}分間隔`}
              </Badge>
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
                      ? 'text-red-500'
                      : busStatus.status === 'soon'
                        ? 'text-blue-500'
                        : 'text-foreground'
                )}
              >
                {busStatus.text}
              </span>

              {/* 始発バッジ */}
              {bus.isFirstBus && (
                <Badge variant="default" className="font-semibold bg-blue-400 text-white">
                  始
                </Badge>
              )}

              {/* 最終便バッジ */}
              {bus.isLastBus && (
                <Badge variant="default" className="font-semibold bg-red-400 text-white">
                  終
                </Badge>
              )}

              <Badge variant="secondary" className="md:hidden">
                {bus.arrivalTime}
              </Badge>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
