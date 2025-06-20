'use client'

import Header from '@/components/header'
import NavBar from '@/components/nav-bar'
import { cn } from '@/lib/utils'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <Header />
      <div className={cn('p-1 min-h-screen mx-auto max-w-6xl my-12')}>{children}</div>
      <NavBar />
    </div>
  )
}
