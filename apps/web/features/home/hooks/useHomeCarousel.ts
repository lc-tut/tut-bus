// features/home/hooks/useHomeCarousel.ts
'use client'

import { useAtom } from 'jotai'
import { useRef, useCallback } from 'react'
import type { CarouselApi } from '@/components/ui/carousel'
import { lastSlideAtom } from '@/store'

export const useHomeCarousel = () => {
  const apiRef = useRef<CarouselApi | null>(null)

  const [lastSlide, setLastSlide] = useAtom(lastSlideAtom)

  const bindApi = useCallback((instance: CarouselApi | null) => {
    apiRef.current = instance
  }, [])

  const onSelect = useCallback((cb: (idx: number) => void): (() => void) => {
    const api = apiRef.current
    if (!api) return () => {}
    const fn = () => cb(api.selectedScrollSnap())
    api.on('select', fn)
    return () => api.off('select', fn)
  }, [])

  /** 外部に渡すのは bindApi と onSelect だけで十分 */
  return { bindApi, onSelect, lastSlide, setLastSlide, apiRef }
}
