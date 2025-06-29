'use client'

import Header from '@/components/Header'
import NavBar from '@/components/NavBar'
import { cn } from '@/lib/utils'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <Header />
      <div className={cn('p-1 min-h-screen mx-auto max-w-6xl my-16')}>{children}</div>
      <NavBar />
    </div>
  )
}
