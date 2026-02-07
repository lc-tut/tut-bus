'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BiBus, BiHome, BiSolidBus, BiSolidHome } from 'react-icons/bi'
import { RiShieldUserLine } from 'react-icons/ri'

import { useSession } from '@/lib/auth-client'

const pcNavItems = [
  { label: 'ホーム', href: '/', icon: BiHome, activeIcon: BiSolidHome },
  { label: '時刻表', href: '/timetable', icon: BiBus, activeIcon: BiSolidBus },
]

const Header: React.FC = () => {
  return (
    <header className="w-full flex items-center justify-between border-b h-20 shadow-sm bg-background fixed top-0 left-0 z-50 md:h-16">
      <div className="flex items-center gap-4 px-4">
        <Image
          src="/tut-logo.png"
          alt="Logo"
          width={60}
          height={60}
          priority={true}
          className="md:w-10 md:h-10 w-[60px] h-[60px]"
        />
        <h1 className="text-2xl font-bold">スクールバス</h1>
      </div>
      <PCNav />
    </header>
  )
}

function PCNav() {
  const pathname = usePathname()

  // /~offline 配下ではナビを表示しない
  if (pathname?.startsWith('/~offline')) return null

  return (
    <nav className="hidden sm:flex items-center gap-1 pr-4">
      {pcNavItems.map((item) => {
        const isActive =
          item.href === '/' ? pathname === '/' : (pathname?.startsWith(item.href) ?? false)
        const Icon = isActive ? item.activeIcon : item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
      <AdminLink />
    </nav>
  )
}

function AdminLink() {
  const { data: session } = useSession()
  if (!session) return null

  return (
    <Link
      href="/admin"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted ml-2 border border-dashed border-muted-foreground/30"
    >
      <RiShieldUserLine className="h-4 w-4" />
      管理画面
    </Link>
  )
}

export default Header
