'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BiBus, BiCog, BiHome, BiSolidBus, BiSolidCog, BiSolidHome } from 'react-icons/bi'
import { RiShieldUserFill, RiShieldUserLine } from 'react-icons/ri'

import { useSession } from '@/lib/auth-client'

const navItems = [
  {
    label: 'ホーム',
    href: '/',
    icon: <BiHome />,
    selectedIcon: <BiSolidHome />,
  },
  {
    label: '時刻表',
    href: '/timetable',
    icon: <BiBus />,
    selectedIcon: <BiSolidBus />,
  },
  {
    label: '設定',
    href: '/config',
    icon: <BiCog />,
    selectedIcon: <BiSolidCog />,
  },
]

export default function NavBar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const allNavItems = session
    ? [
        ...navItems,
        {
          label: '管理画面',
          href: '/admin',
          icon: <RiShieldUserLine />,
          selectedIcon: <RiShieldUserFill />,
        },
      ]
    : navItems

  return (
    <nav className="w-full fixed bottom-0 left-0 shadow-xs border-t bg-background y sm:hidden">
      <ul className={`h-20 grid gap-4 ${session ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {allNavItems.map((item) => {
          const selected =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href} className="flex items-center justify-center">
              <Link
                href={item.href}
                className={`text-xs font-medium transition-colors flex flex-col items-center ${
                  selected ? 'text-primary' : 'active:text-primary hover:text-primary'
                }`}
              >
                <span className="text-3xl mb-1">{selected ? item.selectedIcon : item.icon}</span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
