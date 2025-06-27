'use client'

import type { CarouselApi } from '@/components/ui/carousel'
import { lastSlideAtom } from '@/store'
import { useAtom } from 'jotai'
import { useCallback, useRef } from 'react'

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

  return { bindApi, onSelect, lastSlide, setLastSlide, apiRef }
}
