'use client'

import { CacheWarmer } from '@/components/cache-warmer'
import Header from '@/components/header'
import NavBar from '@/components/nav-bar'
import { OfflineBanner } from '@/components/offline-banner'
import { cn } from '@/lib/utils'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <Header />
      <OfflineBanner />
      <CacheWarmer />
      <div className="pt-20 md:pt-16">
        <div className={cn('p-1 min-h-screen mx-auto max-w-6xl')}>{children}</div>
      </div>
      <NavBar />
    </div>
  )
}
