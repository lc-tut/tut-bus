'use client'

import { TimetableDisplay } from '@/components/home/timetable-display'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { components, operations } from '@/generated/oas'
import { client } from '@/lib/client'
import { DisplayBusInfo } from '@/lib/types/timetable'
import { generateDisplayBuses } from '@/lib/utils/timetable'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { FaArrowRight, FaMapMarkerAlt } from 'react-icons/fa'

function filterBusesByDeparture(buses: DisplayBusInfo[], now: Date): DisplayBusInfo[] {
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const toMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  // 現在時刻でバスを2つに分ける
  const pastBuses = buses
    .filter((bus) => toMinutes(bus.departureTime) < currentMinutes)
    .sort((a, b) => toMinutes(b.departureTime) - toMinutes(a.departureTime)) // 降順にソート

  const upcomingBuses = buses
    .filter((bus) => toMinutes(bus.departureTime) >= currentMinutes)
    .sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime)) // 昇順にソート

  // 一本前のバスと次の5本のバスを合わせる
  const previousBus = pastBuses.length > 0 ? [pastBuses[0]] : []
  const nextBuses = upcomingBuses.slice(0, 3)

  // 一本前のバスを先頭に、その後に次の5本のバスを配置
  return [...previousBus, ...nextBuses]
}

// 目的地でバスをフィルタリングする関数
function filterBusesByDestination(
  buses: DisplayBusInfo[],
  destinationId: number | null
): DisplayBusInfo[] {
  if (!destinationId) return buses

  return buses.filter((bus) => parseInt(bus.destination.stopId, 10) === destinationId)
}

export default function Home() {
  const [now, setNow] = useState<Date | null>(null)
  const [busStopGroups, setBusStopGroups] = useState<
    components['schemas']['Models.BusStopGroup'][]
  >([])
  const [isLoadingDepartures, setLoadingDepartures] = useState<boolean>(false)
  const [selectedDestinations, setSelectedDestinations] = useState<{
    [groupId: number]: number | null
  }>({})
  const [groupTimetables, setGroupTimetables] = useState<{
    [groupId: number]: {
      filtered: DisplayBusInfo[]
      raw: components['schemas']['Models.BusStopGroupTimetable']
      allBuses: DisplayBusInfo[]
    }
  }>({})

  useEffect(() => {
    const fetchBusStopGroups = async () => {
      setLoadingDepartures(true)
      try {
        const { data, error } = await client.GET('/api/bus-stops/groups')

        if (error || !data) {
          console.error('Error fetching bus stop groups:', error)
          setBusStopGroups([])
        } else {
          setBusStopGroups(data)
        }
      } catch (err) {
        console.error('Exception fetching bus stop groups:', err)
        setBusStopGroups([])
      } finally {
        setLoadingDepartures(false)
      }
    }

    fetchBusStopGroups()
  }, [])

  useEffect(() => {
    const fetchAllTimetables = async () => {
      if (!now || busStopGroups.length === 0) return

      const results: {
        [groupId: number]: {
          filtered: DisplayBusInfo[]
          raw: components['schemas']['Models.BusStopGroupTimetable']
          allBuses: DisplayBusInfo[]
        }
      } = {}

      await Promise.all(
        busStopGroups.map(async (group) => {
          const params: operations['BusStopGroupsService_getBusStopGroupsTimetable']['parameters'] =
            {
              path: { id: group.id },
              query: { date: format(now, 'yyyy-MM-dd') },
            }

          const { data, error } = await client.GET('/api/bus-stops/groups/{id}/timetable', {
            params,
          })

          if (data && !error) {
            const displayBuses = generateDisplayBuses(busStopGroups, data, null)
            const timesFilteredBuses = filterBusesByDeparture(displayBuses, now)

            results[group.id] = {
              raw: data,
              filtered: timesFilteredBuses,
              allBuses: displayBuses,
            }

            if (data.segments && data.segments.length > 0) {
              const uniqueDestinations = new Map<number, { stopId: number; stopName: string }>()

              data.segments.forEach((segment) => {
                const stopId = segment.destination.stopId
                uniqueDestinations.set(stopId, {
                  stopId: stopId,
                  stopName: segment.destination.stopName,
                })
              })

              const firstDestination = Array.from(uniqueDestinations.values())[0]
              if (firstDestination) {
                setSelectedDestinations((prev) => ({
                  ...prev,
                  [group.id]: firstDestination.stopId,
                }))

                const destinationFiltered = filterBusesByDestination(
                  displayBuses,
                  firstDestination.stopId
                )

                results[group.id].filtered = filterBusesByDeparture(destinationFiltered, now)
              }
            }
          }
        })
      )

      setGroupTimetables(results)
    }

    fetchAllTimetables()
  }, [busStopGroups, now])

  useEffect(() => {
    const currentDate = new Date()
    console.log(currentDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))
    setNow(currentDate)

    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="my-10">
      {isLoadingDepartures ? (
        <div className="text-center text-lg py-10">読み込み中...</div>
      ) : (
        <Carousel className="w-full">
          <CarouselContent className="mx-[5vw]">
            {busStopGroups.map((group, index) => (
              <CarouselItem key={index} className="basis-[90vw] px-2 flex justify-center max-w-lg">
                <Card className="w-full overflow-hidden border-muted pt-0 my-1 block border-1 border-gray">
                  <div className="bg-blue-100/60 dark:bg-blue-950/20 px-4 py-3 min-h-[64px] flex items-center">
                    <div className="flex items-center w-full">
                      <Badge
                        variant="outline"
                        className="mr-6 bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300 text-xs whitespace-nowrap flex items-center"
                      >
                        <FaMapMarkerAlt className="mr-1 size-3" />
                        出発
                      </Badge>
                      <h2 className="text-lg font-bold truncate">{group.name}</h2>
                    </div>
                  </div>

                  {(() => {
                    // 重複を排除するためにMapを使用
                    const uniqueDestinations = new Map<
                      number,
                      { stopId: number; stopName: string }
                    >()

                    groupTimetables[group.id]?.raw?.segments.forEach((segment) => {
                      const stopId = segment.destination.stopId
                      uniqueDestinations.set(stopId, {
                        stopId: stopId,
                        stopName: segment.destination.stopName,
                      })
                    })

                    const destinations = Array.from(uniqueDestinations.values())

                    // 行先が1つだけの場合は自動的に選択
                    if (
                      destinations.length === 1 &&
                      selectedDestinations[group.id] !== destinations[0].stopId
                    ) {
                      setSelectedDestinations((prev) => ({
                        ...prev,
                        [group.id]: destinations[0].stopId,
                      }))
                    }

                    return (
                      <div className="px-4 py-3 bg-green-100/80 dark:bg-green-950/20 min-h-[64px] flex items-center">
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
                              value={selectedDestinations[group.id]?.toString() || undefined}
                              onValueChange={(value) => {
                                const stopId = parseInt(value, 10)
                                setSelectedDestinations({
                                  ...selectedDestinations,
                                  [group.id]: stopId,
                                })

                                if (groupTimetables[group.id]) {
                                  const currentTimetable = { ...groupTimetables }
                                  const destinationFiltered = filterBusesByDestination(
                                    currentTimetable[group.id].allBuses,
                                    stopId
                                  )
                                  const timeFiltered = filterBusesByDeparture(
                                    destinationFiltered,
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
                                {selectedDestinations[group.id] ? (
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
                                    className="text-sm py-2 cursor-pointer"
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

                  <TimetableDisplay
                    selectedDeparture={group.id}
                    filteredTimetable={groupTimetables[group.id]?.filtered || []}
                    now={now}
                  />
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </div>
  )
}
