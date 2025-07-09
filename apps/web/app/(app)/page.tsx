import type { CarouselApi } from '@/components/ui/carousel'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { GroupTimetable } from '@/features/home/components/GroupTimetable'
import { useHomeCarousel } from '@/features/home/hooks/useHomeCarousel'
import { useBusStopGroups } from '@/hooks/busStops/useBusStopGroups'
import { useNow } from '@/hooks/common/useNow'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const LAST_SELECT_DEPURTURE_GROUP_QUERY = 'group_id'

export const metadata = {
  title: 'バス時刻表',
  description: '出発地・目的地別のリアルタイムバス時刻表を表示します',
}

export const HomePage = () => {
  const { busStopGroups, isLoading, error } = useBusStopGroups()
  const { bindApi, onSelect, lastSlide, setLastSlide, apiRef } = useHomeCarousel()
  const router = useRouter()
  const now = useNow()
  const initializedRef = useRef(false)
  const [apiReady, setApiReady] = useState(false)

  const handleBindApi = (api: CarouselApi) => {
    bindApi(api)
    if (api) {
      setApiReady(true)
    }
  }

  useEffect(() => {
    if (!apiRef.current || !busStopGroups.length) return

    // 既に初期化済みの場合は何もしない（ユーザー操作による切り替えを尊重）
    if (initializedRef.current) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const groupIdStr = params.get(LAST_SELECT_DEPURTURE_GROUP_QUERY)

    if (groupIdStr) {
      const groupId = parseInt(groupIdStr, 10)
      const idx = busStopGroups.findIndex((group) => group.id === groupId)
      if (idx >= 0) {
        apiRef.current.scrollTo(idx)
        setLastSlide(idx)
      }
    } else {
      // URLパラメータがない場合は、lastSlideに移動してURLを更新
      if (lastSlide >= 0 && lastSlide < busStopGroups.length) {
        apiRef.current.scrollTo(lastSlide)
        // URLパラメータも更新
        const selectedGroup = busStopGroups[lastSlide]
        params.set(LAST_SELECT_DEPURTURE_GROUP_QUERY, selectedGroup.id.toString())
        router.replace(`?${params.toString()}`, { scroll: false })
      }
    }

    // 初期化完了をマーク
    initializedRef.current = true
  }, [apiRef, busStopGroups, lastSlide, router, setLastSlide])

  useEffect(() => {
    // APIとbusStopGroupsの両方が利用可能になるまで待つ
    if (!apiReady || !apiRef.current || busStopGroups.length === 0) {
      return
    }

    const cleanup = onSelect((idx) => {
      if (idx >= 0 && idx < busStopGroups.length) {
        const params = new URLSearchParams(window.location.search)
        const selectedGroup = busStopGroups[idx]
        params.set(LAST_SELECT_DEPURTURE_GROUP_QUERY, selectedGroup.id.toString())
        const newUrl = `?${params.toString()}`
        router.replace(newUrl, { scroll: false })
        setLastSlide(idx)
      }
    })

    return cleanup
  }, [onSelect, router, setLastSlide, busStopGroups, apiRef, apiReady])

  if (error) return <div className="py-16 text-center text-red-500">データ取得に失敗しました</div>
  if (isLoading) return <div className="py-16 text-center">読み込み中...</div>

  return (
    <Carousel className="py-5 w-full" setApi={handleBindApi}>
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

export default HomePage
