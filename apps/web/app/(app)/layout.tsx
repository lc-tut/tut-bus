'use client'

import Header from '@/components/header'
import NavBar from '@/components/nav-bar'
import { cn } from '@/lib/utils'
import { isInPWA } from '@/lib/utils/pwa'
import { useEffect, useState } from 'react'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    setIsPWA(isInPWA())
  }, [])

  return (
    <div>
      {!isPWA && <Header />}
      <div className={cn('p-1 min-h-screen mx-auto max-w-6xl', isPWA ? 'my-12' : 'my-20')}>
        {children}
      </div>
      <NavBar />
    </div>
  )
}
