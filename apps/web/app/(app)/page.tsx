import { Suspense } from 'react'
import { HomeContent } from '@/features/home/components/HomeContent'

export const metadata = {
  title: 'バス時刻表',
  description: '出発地・行き先別のリアルタイムバス時刻表を表示します',
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="py-16 text-center">読み込み中...</div>}>
      <HomeContent />
    </Suspense>
  )
}
