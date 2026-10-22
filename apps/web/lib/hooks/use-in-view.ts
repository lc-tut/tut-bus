'use client'

import { useEffect, useState } from 'react'

// 画面内に入ったら true になる
// display: none のレイアウト（PC/スマホの片方）では false のままなので、無駄な取得や地図の生成を防げる
export function useInView<T extends Element>(rootMargin = '100px') {
  const [el, setEl] = useState<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      setInView(false)
    }
  }, [el, rootMargin])
  return { ref: setEl, inView }
}
