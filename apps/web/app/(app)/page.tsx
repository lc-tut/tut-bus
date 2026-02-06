'use client'

import { TimetableDisplay } from '@/components/home/timetable-display'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { components, operations } from '@/generated/oas'
import { client } from '@/lib/client'
import { DisplayBusInfo } from '@/lib/types/timetable'
import { generateDisplayBuses } from '@/lib/utils/timetable'
import { lastSlideAtom, selectedDestinationsAtom } from '@/store'
import { format } from 'date-fns'
import { useAtom } from 'jotai'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { FaArrowRight, FaBan, FaExclamationTriangle, FaMapMarkerAlt } from 'react-icons/fa'

// エラー情報の型定義
interface AppError {
  type: 'network' | 'api' | 'unknown'
  message: string
  details?: string
}

// エラーメッセージコンポーネント
function ErrorMessage({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FaExclamationTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-2 text-base font-medium text-red-700 dark:text-red-300">
        {error.type === 'network' ? 'ネットワークエラー' : 'データの取得に失敗しました'}
      </h3>
      <p className="mt-2 text-xs text-muted-foreground max-w-xs">{error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
        >
          再試行
        </button>
      )}
    </div>
  )
}

// エラーハンドリング用のカスタムフック
function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null)

  const handleError = useCallback((err: unknown, context: string) => {
    if (err instanceof Error) {
      if (err.message.includes('fetch') || err.message.includes('network')) {
        setError({
          type: 'network',
          message: 'インターネット接続を確認してください',
          details: err.message,
        })
      } else {
        setError({
          type: 'api',
          message: 'データの取得中にエラーが発生しました',
          details: err.message,
        })
      }
    } else {
      setError({
        type: 'unknown',
        message: '予期しないエラーが発生しました',
        details: String(err),
      })
    }

    // 開発環境でのみ詳細ログを出力
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error in ${context}:`, err)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { error, handleError, clearError }
}

function extractDestinations(
  groupTimetable:
    | {
        filtered: DisplayBusInfo[]
        raw: components['schemas']['Models.BusStopGroupTimetable']
        allBuses: DisplayBusInfo[]
      }
    | undefined
): { stopId: number; stopName: string }[] {
  const uniqueDestinations = new Map<number, { stopId: number; stopName: string }>()

  // allBusesから行き先を取得
  groupTimetable?.allBuses?.forEach((bus) => {
    if (bus?.destination?.stopId && bus?.destination?.stopName) {
      const stopId = parseInt(bus.destination.stopId, 10)
      uniqueDestinations.set(stopId, {
        stopId: stopId,
        stopName: bus.destination.stopName,
      })
    }
  })

  if (uniqueDestinations.size === 0) {
    groupTimetable?.raw?.segments?.forEach((segment) => {
      if (segment?.destination?.stopId && segment?.destination?.stopName) {
        const stopId = segment.destination.stopId
        uniqueDestinations.set(stopId, {
          stopId: stopId,
          stopName: segment.destination.stopName,
        })
      }
    })
  }

  return Array.from(uniqueDestinations.values())
}

// データ読み込み中メッセージコンポーネント
function LoadingMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FaMapMarkerAlt className="h-8 w-8 text-blue-400" />
      </div>
      <h3 className="mt-2 text-base font-medium">時刻表を読み込み中...</h3>
      <p className="mt-2 text-xs text-muted-foreground max-w-xs">しばらくお待ちください</p>
    </div>
  )
}

// バスフィルタリング用のヘルパー関数群
const BusFilters = {
  // 現在時刻以降のバスのみ取得
  upcomingOnly: (buses: DisplayBusInfo[], now: Date): DisplayBusInfo[] => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const toMinutes = (timeStr: string): number => {
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    return buses
      .filter((bus) => toMinutes(bus.departureTime) >= currentMinutes)
      .sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))
  },

  // 件数制限付きフィルタ（過去1本 + 今後2本）
  limitedWithPrevious: (buses: DisplayBusInfo[], now: Date): DisplayBusInfo[] => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const toMinutes = (timeStr: string): number => {
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    const pastBuses = buses
      .filter((bus) => toMinutes(bus.departureTime) < currentMinutes)
      .sort((a, b) => toMinutes(b.departureTime) - toMinutes(a.departureTime))

    const upcomingBuses = buses
      .filter((bus) => toMinutes(bus.departureTime) >= currentMinutes)
      .sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))

    const previousBus = pastBuses.length > 0 ? [pastBuses[0]] : []
    const nextBuses = upcomingBuses.slice(0, 2)

    return [...previousBus, ...nextBuses]
  },

  // 目的地でフィルタリング
  byDestination: (buses: DisplayBusInfo[], destinationId: number | null): DisplayBusInfo[] => {
    if (!destinationId) return buses
    return buses.filter((bus) => parseInt(bus.destination.stopId, 10) === destinationId)
  },

  // 複合フィルタ：目的地 + 今後のバスのみ
  upcomingByDestination: (
    buses: DisplayBusInfo[],
    destinationId: number | null,
    now: Date
  ): DisplayBusInfo[] => {
    const destinationFiltered = BusFilters.byDestination(buses, destinationId)
    return BusFilters.upcomingOnly(destinationFiltered, now)
  },

  // 複合フィルタ：目的地 + 件数制限
  limitedByDestination: (
    buses: DisplayBusInfo[],
    destinationId: number | null,
    now: Date
  ): DisplayBusInfo[] => {
    const destinationFiltered = BusFilters.byDestination(buses, destinationId)
    return BusFilters.limitedWithPrevious(destinationFiltered, now)
  },
}

// 後方互換性のための関数（既存コードで使用されている）
function filterBusesByDeparture(buses: DisplayBusInfo[], now: Date): DisplayBusInfo[] {
  return BusFilters.limitedWithPrevious(buses, now)
}

function filterBusesByDestination(
  buses: DisplayBusInfo[],
  destinationId: number | null
): DisplayBusInfo[] {
  return BusFilters.byDestination(buses, destinationId)
}

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lastSlide, setLastSlide] = useAtom(lastSlideAtom)
  const [selectedDestinations, setSelectedDestinations] = useAtom(selectedDestinationsAtom)
  const [now, setNow] = useState<Date | null>(null)
  const [busStopGroups, setBusStopGroups] = useState<
    components['schemas']['Models.BusStopGroup'][]
  >([])
  const [isLoadingDepartures, setLoadingDepartures] = useState<boolean>(false)
  const [groupTimetables, setGroupTimetables] = useState<{
    [groupId: number]: {
      filtered: DisplayBusInfo[]
      raw: components['schemas']['Models.BusStopGroupTimetable']
      allBuses: DisplayBusInfo[]
    }
  }>({})
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [isInitialized, setIsInitialized] = useState(false)

  // エラーハンドリング
  const { error, handleError, clearError } = useErrorHandler()

  const updateUrlParams = useCallback(
    (slideIndex: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('s', slideIndex.toString())
      const newUrl = params.toString() ? `?${params.toString()}` : ''
      router.replace(newUrl, { scroll: false })
      setLastSlide(slideIndex)
    },
    [router, searchParams, setLastSlide]
  )

  useEffect(() => {
    if (!carouselApi || busStopGroups.length === 0 || isInitialized) return

    const slideParam = searchParams.get('s')
    // 優先度: 1. URL → 2. localStorage → 3. その他（デフォルト0）
    const initialSlide = slideParam ? parseInt(slideParam, 10) : lastSlide
    if (initialSlide >= 0 && initialSlide < busStopGroups.length) {
      carouselApi.scrollTo(initialSlide)
      setIsInitialized(true)

      if (!slideParam && initialSlide !== 0) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('s', initialSlide.toString())
        const newUrl = params.toString() ? `?${params.toString()}` : ''
        router.replace(newUrl, { scroll: false })
      }
    }
  }, [carouselApi, busStopGroups.length, isInitialized, searchParams, lastSlide, router])

  useEffect(() => {
    if (!carouselApi) return

    const onSelect = () => {
      const selectedIndex = carouselApi.selectedScrollSnap()
      updateUrlParams(selectedIndex)
    }

    carouselApi.on('select', onSelect)

    return () => {
      carouselApi.off('select', onSelect)
    }
  }, [carouselApi, updateUrlParams])

  useEffect(() => {
    const fetchBusStopGroups = async () => {
      setLoadingDepartures(true)
      clearError() // エラーをクリア

      try {
        const { data, error } = await client.GET('/api/bus-stops/groups')

        if (error || !data) {
          handleError(new Error(`API Error: ${error || 'No data received'}`), 'fetchBusStopGroups')
          setBusStopGroups([])
        } else {
          setBusStopGroups(data)
        }
      } catch (err) {
        handleError(err, 'fetchBusStopGroups')
        setBusStopGroups([])
      } finally {
        setLoadingDepartures(false)
      }
    }

    fetchBusStopGroups()
  }, [handleError, clearError])

  // 個別グループの時刻表取得（エラーハンドリング付き）
  const fetchGroupTimetable = useCallback(
    async (group: components['schemas']['Models.BusStopGroup'], currentNow: Date) => {
      try {
        const params: operations['BusStopGroupsService_getBusStopGroupsTimetable']['parameters'] = {
          path: { id: group.id },
          query: { date: format(currentNow, 'yyyy-MM-dd') },
        }

        const { data, error } = await client.GET('/api/bus-stops/groups/{id}/timetable', { params })

        if (data && !error) {
          const displayBuses = generateDisplayBuses(busStopGroups, data, null)
          const timesFilteredBuses = filterBusesByDeparture(displayBuses, currentNow)

          const result = {
            raw: data,
            filtered: timesFilteredBuses,
            allBuses: displayBuses,
          }

          // セグメントから利用可能な目的地情報を保存（選択はuseEffectで行う）
          if (data.segments && data.segments.length > 0) {
            const uniqueDestinations = new Map<number, { stopId: number; stopName: string }>()

            data.segments.forEach((segment) => {
              if (segment?.destination?.stopId && segment?.destination?.stopName) {
                const stopId = segment.destination.stopId
                uniqueDestinations.set(stopId, {
                  stopId: stopId,
                  stopName: segment.destination.stopName,
                })
              }
            })

            // 既存の選択があればそれを使用、なければ後でuseEffectで選択される
            const existingSelection = selectedDestinations[group.id]
            const destinationToUse =
              existingSelection && uniqueDestinations.has(existingSelection)
                ? existingSelection
                : null

            if (destinationToUse) {
              const destinationFiltered = filterBusesByDestination(displayBuses, destinationToUse)
              result.filtered = filterBusesByDeparture(destinationFiltered, currentNow)
            }
          }

          return result
        } else {
          // APIエラーの場合も適切なデフォルト値を返す
          return {
            raw: {
              id: group.id,
              name: group.name,
              date: format(currentNow, 'yyyy-MM-dd'),
              segments: [],
            },
            filtered: [],
            allBuses: [],
          }
        }
      } catch (err) {
        // 個別グループのエラーは表示しない（サイレント処理）
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Failed to fetch timetable for group ${group.name}:`, err)
        }

        return {
          raw: {
            id: group.id,
            name: group.name,
            date: format(currentNow, 'yyyy-MM-dd'),
            segments: [],
          },
          filtered: [],
          allBuses: [],
        }
      }
    },
    [busStopGroups, selectedDestinations]
  )

  useEffect(() => {
    const fetchAllTimetables = async () => {
      if (!now || busStopGroups.length === 0) return

      try {
        const results: {
          [groupId: number]: {
            filtered: DisplayBusInfo[]
            raw: components['schemas']['Models.BusStopGroupTimetable']
            allBuses: DisplayBusInfo[]
          }
        } = {}

        // 並列実行でエラーが発生しても他のグループは継続処理
        const timetablePromises = busStopGroups.map(async (group) => {
          const result = await fetchGroupTimetable(group, now)
          results[group.id] = result
        })

        await Promise.allSettled(timetablePromises)
        setGroupTimetables(results)
      } catch (err) {
        handleError(err, 'fetchAllTimetables')
      }
    }

    fetchAllTimetables()
  }, [busStopGroups, now, fetchGroupTimetable, handleError])

  useEffect(() => {
    if (Object.keys(groupTimetables).length === 0) return

    setSelectedDestinations((prev) => {
      const updates: { [groupId: number]: number } = {}

      busStopGroups.forEach((group) => {
        const destinations = extractDestinations(groupTimetables[group.id])

        if (destinations.length > 0) {
          const currentSelection = prev[group.id]

          if (!currentSelection || !destinations.some((d) => d.stopId === currentSelection)) {
            updates[group.id] = destinations[0].stopId
          }
        }
      })

      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev
    })
  }, [groupTimetables, busStopGroups])

  useEffect(() => {
    const currentDate = new Date()
    setNow(currentDate)

    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 15000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="my-5">
      {error ? (
        <ErrorMessage
          error={error}
          onRetry={() => {
            clearError()
            // バス停グループの再取得をトリガー
            window.location.reload()
          }}
        />
      ) : isLoadingDepartures ? (
        <div className="text-center text-lg py-10">読み込み中...</div>
      ) : (
        <Carousel className="w-full" setApi={setCarouselApi}>
          <CarouselContent className="mx-[5vw]">
            {busStopGroups.map((group, index) => (
              <CarouselItem key={index} className="basis-[90vw] px-2 flex justify-center max-w-lg">
                <Card className="w-full overflow-hidden border-muted pt-0 my-1 block border-1 border-gray">
                  <div className="bg-blue-100/60 dark:bg-blue-950/60 px-4 py-3 min-h-[64px] flex items-center">
                    <div className="flex items-center w-full">
                      <Badge
                        variant="outline"
                        className="mr-6 bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300 text-xs whitespace-nowrap flex items-center"
                      >
                        <FaMapMarkerAlt className="mr-1 size-3" />
                        出発地
                      </Badge>
                      <h2 className="text-lg font-bold truncate">{group.name}</h2>
                    </div>
                  </div>

                  {(() => {
                    const destinations = extractDestinations(groupTimetables[group.id])

                    // 行き先がない場合は選択UIを表示しない（下のメッセージで処理）
                    if (destinations.length === 0) {
                      return null
                    }

                    return (
                      <div className="px-4 py-3 bg-green-100/80 dark:bg-green-950/60 min-h-[64px] flex items-center">
                        <div className="flex items-center w-full">
                          <Badge
                            variant="outline"
                            className="mr-6 bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300 text-xs whitespace-nowrap flex items-center"
                          >
                            <FaArrowRight className="mr-1 size-3" />
                            行先
                          </Badge>

                          {destinations.length === 1 ? (
                            <div className="min-h-[36px] h-9 flex items-center py-1">
                              <h2 className="text-lg font-semibold truncate">
                                {destinations[0].stopName}
                              </h2>
                            </div>
                          ) : (
                            <Select
                              value={selectedDestinations[group.id]?.toString() || ''}
                              onValueChange={(value) => {
                                const stopId = parseInt(value, 10)
                                setSelectedDestinations({
                                  ...selectedDestinations,
                                  [group.id]: stopId,
                                })

                                if (groupTimetables[group.id]) {
                                  const currentTimetable = { ...groupTimetables }
                                  const timeFiltered = BusFilters.limitedByDestination(
                                    currentTimetable[group.id].allBuses,
                                    stopId,
                                    now!
                                  )

                                  currentTimetable[group.id] = {
                                    ...currentTimetable[group.id],
                                    filtered: timeFiltered,
                                  }

                                  setGroupTimetables(currentTimetable)
                                }
                              }}
                            >
                              <SelectTrigger className="w-full text-lg  h-9 py-1 min-h-[36px] bg-background">
                                {selectedDestinations[group.id] &&
                                (selectedDestinations[group.id] ?? 0) > 0 ? (
                                  <span className="truncate font-bold">
                                    {
                                      destinations.find(
                                        (d) => d.stopId === selectedDestinations[group.id]
                                      )?.stopName
                                    }
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    行先を選択（{destinations.length}件）
                                  </span>
                                )}
                              </SelectTrigger>
                              <SelectContent className="max-w-[350px]">
                                <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                                  行先を選択してください（{destinations.length}件）
                                </div>
                                {destinations.map((dest, idx) => (
                                  <SelectItem
                                    key={idx}
                                    value={String(dest.stopId)}
                                    className="text-sm py-2"
                                  >
                                    <div className="flex items-center w-full">
                                      <span className="truncate">{dest.stopName}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {(() => {
                    const uniqueDestinations = new Map<
                      number,
                      { stopId: number; stopName: string }
                    >()
                    groupTimetables[group.id]?.allBuses?.forEach((bus) => {
                      if (bus?.destination?.stopId && bus?.destination?.stopName) {
                        const stopId = parseInt(bus.destination.stopId, 10)
                        uniqueDestinations.set(stopId, {
                          stopId: stopId,
                          stopName: bus.destination.stopName,
                        })
                      }
                    })

                    if (uniqueDestinations.size === 0) {
                      groupTimetables[group.id]?.raw?.segments?.forEach((segment) => {
                        if (segment?.destination?.stopId && segment?.destination?.stopName) {
                          const stopId = segment.destination.stopId
                          uniqueDestinations.set(stopId, {
                            stopId: stopId,
                            stopName: segment.destination.stopName,
                          })
                        }
                      })
                    }

                    const hasDestinations = uniqueDestinations.size > 0
                    const hasFilteredBuses = groupTimetables[group.id]?.filtered?.length > 0
                    const hasAllBuses = groupTimetables[group.id]?.allBuses?.length > 0
                    const hasData = groupTimetables[group.id]

                    const shouldShowNoService = hasData && (!hasDestinations || !hasFilteredBuses)

                    return shouldShowNoService ? (
                      <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                          <FaBan className="h-8 w-8 text-orange-500" />
                        </div>
                        <h3 className="mt-2 text-base font-medium">
                          {!hasDestinations || !hasAllBuses
                            ? '本日の運行予定はありません'
                            : '選択された時刻・行き先のバスはありません'}
                        </h3>
                        <p className="mt-2 text-xs text-muted-foreground max-w-xs">
                          {!hasDestinations || !hasAllBuses
                            ? '必ずしも正しいとは限らないため、公式サイトの運行スケジュールをご確認ください'
                            : '別の行き先を選択するか、しばらく時間をおいてからご確認ください'}
                        </p>
                      </div>
                    ) : null
                  })()}

                  {/* 時刻表表示 */}
                  {groupTimetables[group.id]?.filtered?.length > 0 && (
                    <TimetableDisplay
                      selectedDeparture={group.id}
                      selectedDestination={selectedDestinations[group.id] || null}
                      filteredShortTimetable={groupTimetables[group.id]?.filtered || []}
                      filteredTimetable={
                        now && groupTimetables[group.id]?.allBuses
                          ? BusFilters.upcomingByDestination(
                              groupTimetables[group.id].allBuses,
                              selectedDestinations[group.id] || null,
                              now
                            )
                          : []
                      }
                      arriveTimetable={groupTimetables[group.id]?.filtered || []}
                      now={now}
                      busStopGroups={busStopGroups}
                    />
                  )}

                  {/* データがまだ読み込まれていない場合 */}
                  {!groupTimetables[group.id]?.allBuses && <LoadingMessage />}
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-center text-lg py-10">読み込み中...</div>}>
      <HomeContent />
    </Suspense>
  )
}
