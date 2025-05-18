'use client'
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BiBus, BiHome, BiCog } from 'react-icons/bi'
import { BiSolidBus, BiSolidHome, BiSolidCog } from 'react-icons/bi'

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

  return (
    <nav className="w-full fixed bottom-0 left-0 shadow-xs border-t bg-primary-foreground y sm:hidden">
      <ul className="h-20 grid grid-cols-3 gap-4">
        {navItems.map((item) => {
          const selected = pathname === item.href
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
