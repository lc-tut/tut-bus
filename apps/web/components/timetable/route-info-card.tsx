import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { components } from '@/generated/oas'
import { getShuttleSegments } from '@/lib/utils/timetable'
import { FaShuttleVan } from 'react-icons/fa'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import React from 'react'

interface RouteInfoCardProps {
  timetableData: components['schemas']['Models.BusStopGroupTimetable'] | null
  selectedDeparture: number | null
  selectedDestination: number | null
}

/**
 * ルート情報カードコンポーネント
 * シャトル便の運行情報を表示します
 */
export function RouteInfoCard({
  timetableData,
  selectedDeparture,
  selectedDestination,
  busStopGroups,
  isLoading = false,
}: RouteInfoCardProps & {
  busStopGroups: components['schemas']['Models.BusStopGroup'][]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 px-2 pt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="h-6 w-full rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    )
  }
  const shuttleSegments =
    selectedDeparture != null && selectedDestination != null
      ? getShuttleSegments(busStopGroups, timetableData, selectedDeparture, selectedDestination)
      : []

  if (selectedDeparture == null || selectedDestination == null) return null

  // フィルタリングされた運行情報から各セグメントを抽出

  return (
    <div className="space-y-3">
      {shuttleSegments.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-md p-3">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-sm font-medium mb-3">
            <div className="bg-purple-600 dark:bg-purple-500 text-white rounded-full p-0.5 flex items-center justify-center w-5 h-5">
              <FaShuttleVan className="h-3 w-3" />
            </div>
            <span>シャトル便運行情報</span>
            {shuttleSegments.length > 1 && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-2 h-5 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300 font-medium ml-1"
              >
                {shuttleSegments.length}個の時間帯
              </Badge>
            )}
          </div>

          <div>
            <div className="bg-purple-100/50 dark:bg-purple-900/30 rounded-md p-2.5 mt-2">
              <p className="font-medium mb-1.5">シャトル便について</p>
              <p className="text-[11px] leading-tight">
                シャトル便は乗客数や交通状況により運行間隔が変動します。この時間帯は頻繁にバスが運行するため、時刻表に個別の発車時刻は記載されていません。
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger className="py-3 text-xs">シャトルの詳細表示</AccordionTrigger>
                <AccordionContent className="pb-0 text-xs flex flex-col gap-1 text-balance">
                  <div className="grid grid-cols-3 gap-1 text-purple-500 dark:text-purple-400 ">
                    <p className="mb-1">行き先</p>

                    <p className="mb-1">運行時間帯</p>

                    <p className="mb-1">運行間隔</p>

                    {shuttleSegments
                      .filter((s) => s.segmentType === 'shuttle')
                      .map((segment, index) => (
                        // key だけ別 div に付ける
                        <React.Fragment key={`shuttle-${index}`}>
                          <div className="text-purple-800 dark:text-purple-300">
                            {segment.destination.stopName}
                          </div>
                          <div className="text-purple-800 dark:text-purple-300">
                            {segment.shuttleTimeRange?.startTime} 〜{' '}
                            {segment.shuttleTimeRange?.endTime}
                          </div>
                          <div className="text-purple-800 dark:text-purple-300">
                            約{segment.shuttleTimeRange?.intervalRange.min}〜
                            {segment.shuttleTimeRange?.intervalRange.max}分
                          </div>
                        </React.Fragment>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      )}
    </div>
  )
}
