'use Client'
import { useEffect, useState } from 'react'

/**
 * 現在時刻を返し、interval ミリ秒ごとに自動更新するフック
 * @param interval デフォルト 60_000 (= 1 分)
 */
export const useNow = (interval = 60_000) => {
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval)
    return () => clearInterval(id)
  }, [interval])

  return now
}
