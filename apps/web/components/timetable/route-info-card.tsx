import { Badge } from '@/components/ui/badge'
import { FaShuttleVan } from 'react-icons/fa'
import { getShuttleSegments } from '@/lib/utils/timetable'

interface RouteInfoCardProps {
  selectedDeparture: string
  selectedDestination: string
}

/**
 * ルート情報カードコンポーネント
 * シャトル便の運行情報を表示します
 */
export function RouteInfoCard({ selectedDeparture, selectedDestination }: RouteInfoCardProps) {
  if (!selectedDeparture || !selectedDestination) return null

  // フィルタリングされた運行情報から各セグメントを抽出
  const shuttleSegments = getShuttleSegments(selectedDeparture, selectedDestination)

  return (
    <div className="space-y-3">
      {shuttleSegments.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
          <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-3">
            <div className="bg-purple-600 text-white rounded-full p-0.5 flex items-center justify-center w-5 h-5">
              <FaShuttleVan className="h-3 w-3" />
            </div>
            <span>シャトル便運行情報</span>
            {shuttleSegments.length > 1 && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-2 h-5 border-purple-400 text-purple-700 font-medium ml-1"
              >
                {shuttleSegments.length}時間帯
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            {shuttleSegments.map((segment, index) => {
              // segmentTypeがshuttleの場合のみ処理を進める
              if (segment.segmentType !== 'shuttle') return null

              return (
                <div key={`shuttle-${index}`} className="text-xs text-purple-800">
                  {shuttleSegments.length > 1 && (
                  <div className="flex items-center mb-2">
                    <Badge 
                      variant="default"
                      className="bg-purple-200 text-purple-800 text-[10px] py-0 px-2 h-5 font-medium border-0"
                    >
                      時間帯 {index + 1}
                    </Badge>
                  </div>
                )}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-purple-500 mb-1">行き先</p>
                      <div className="font-medium">
                        {segment.destination.stopName}
                      </div>
                    </div>

                    <div>
                      <p className="text-purple-500 mb-1">運行時間帯</p>
                      <div className="font-medium">
                        {segment.startTime} 〜 {segment.endTime}
                      </div>
                    </div>

                    <div>
                      <p className="text-purple-500 mb-1">運行間隔</p>
                      <div className="font-medium">
                        約{segment.intervalRange.min}〜{segment.intervalRange.max}分
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="bg-purple-100/50 rounded-md p-2.5 mt-2">
              <p className="font-medium mb-1.5">シャトル便について</p>
              <p className="text-[11px] leading-tight">
                シャトル便は乗客数や交通状況により運行間隔が変動します。この時間帯は頻繁にバスが運行するため、時刻表に個別の発車時刻は記載されていません。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
