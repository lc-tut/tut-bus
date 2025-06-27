'use client'

import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { useBusStopGroups } from '@/features/home/hooks/useBusStopGroups'
import { useHomeCarousel } from '@/features/home/hooks/useHomeCarousel'
import { useNow } from '@/hooks/common/useNow'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { GroupTimetable } from './GroupTimetable'

export const HomeContent = () => {
  const { busStopGroups, isLoading, error } = useBusStopGroups()
  const { bindApi, onSelect, lastSlide, setLastSlide, apiRef } = useHomeCarousel()
  const router = useRouter()
  const now = useNow()

  useEffect(() => {
    if (!apiRef.current || !busStopGroups.length) return
    const params = new URLSearchParams(window.location.search)
    const idxStr = params.get('s')
    const idx = idxStr ? parseInt(idxStr, 10) : lastSlide
    if (idx >= 0 && idx < busStopGroups.length) apiRef.current.scrollTo(idx)
  }, [apiRef, busStopGroups.length, lastSlide])

  useEffect(() => {
    return onSelect((idx) => {
      const params = new URLSearchParams(window.location.search)
      params.set('s', idx.toString())
      router.replace(`?${params}`, { scroll: false })
      setLastSlide(idx)
    })
  }, [onSelect, router, setLastSlide])

  if (error) return <div className="py-16 text-center text-red-500">データ取得に失敗しました</div>
  if (isLoading) return <div className="py-16 text-center">読み込み中...</div>

  return (
    <Carousel className="w-full" setApi={bindApi}>
      <CarouselContent className="mx-[5vw]">
        {busStopGroups.map((g) => (
          <CarouselItem key={g.id} className="basis-[90vw] px-2 flex justify-center max-w-lg">
            <GroupTimetable group={g} date={now} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
