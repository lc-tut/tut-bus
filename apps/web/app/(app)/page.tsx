'use client'

import { TimetableDisplay } from '@/components/home/timetable-display'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { components, operations } from '@/generated/oas'
import { client } from '@/lib/client'
import { DisplayBusInfo } from '@/lib/types/timetable'
import { generateDisplayBuses } from '@/lib/utils/timetable'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'

function filterBusesByDeparture(buses: DisplayBusInfo[], now: Date): DisplayBusInfo[] {
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const toMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  return buses
    .filter((bus) => toMinutes(bus.departureTime) >= currentMinutes)
    .sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime))
    .slice(0, 5)
}

export default function Home() {
  const [now, setNow] = useState<Date | null>(null)
  const [busStopGroups, setBusStopGroups] = useState<
    components['schemas']['Models.BusStopGroup'][]
  >([])
  const [isLoadingDepartures, setLoadingDepartures] = useState<boolean>(false)
  const [groupTimetables, setGroupTimetables] = useState<{
    [groupId: number]: {
      filtered: DisplayBusInfo[]
      raw: components['schemas']['Models.BusStopGroupTimetable']
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
            results[group.id] = {
              raw: data,
              filtered: filterBusesByDeparture(displayBuses, now),
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
    }, 60000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="my-10">
      {isLoadingDepartures ? (
        <div className="text-center text-lg py-10">読み込み中...</div>
      ) : (
        <Carousel>
          <CarouselContent className="mx-[5vw]">
            {busStopGroups.map((group, index) => (
              <CarouselItem key={index} className="basis-[90vw] px-2 flex justify-center max-w-lg">
                <Card className="w-full aspect-[6/7] flex flex-col justify-start items-center">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">{group.name}</CardTitle>
                  </CardHeader>

                  <TimetableDisplay
                    selectedDeparture={group.id}
                    selectedDestination={null}
                    filteredTimetable={groupTimetables[group.id]?.filtered || []}
                    now={now}
                    timetableData={groupTimetables[group.id]?.raw || null}
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
