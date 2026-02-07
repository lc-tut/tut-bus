'use client'

import { AnnouncementBanner } from '@/components/announcement-banner'
import { CacheWarmer } from '@/components/cache-warmer'
import Header from '@/components/header'
import NavBar from '@/components/nav-bar'
import { OfflineBanner } from '@/components/offline-banner'
import { cn } from '@/lib/utils'

const announcementMessage = process.env.NEXT_PUBLIC_ANNOUNCEMENT_MESSAGE
const announcementTitle = process.env.NEXT_PUBLIC_ANNOUNCEMENT_TITLE
const announcementType = process.env.NEXT_PUBLIC_ANNOUNCEMENT_TYPE as 'info' | 'warning' | undefined
const announcementLinkUrl = process.env.NEXT_PUBLIC_ANNOUNCEMENT_LINK_URL
const announcementLinkText = process.env.NEXT_PUBLIC_ANNOUNCEMENT_LINK_TEXT

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
        <AnnouncementBanner
          message={announcementMessage}
          title={announcementTitle}
          type={announcementType}
          linkUrl={announcementLinkUrl}
          linkText={announcementLinkText}
        />
        <div className={cn('p-1 min-h-screen mx-auto max-w-6xl')}>{children}</div>
      </div>
      <NavBar />
    </div>
  )
}
