'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BiBus, BiCog, BiSearch, BiSolidBus, BiSolidCog, BiSolidSearch } from 'react-icons/bi'

const navItems = [
  {
    label: '直近の便',
    href: '/',
    icon: <BiBus />,
    selectedIcon: <BiSolidBus />,
  },
  {
    label: '検索',
    href: '/timetable',
    icon: <BiSearch />,
    selectedIcon: <BiSolidSearch />,
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

  if (pathname === '/what-is-tut-bus') {
    return null
  }

  return (
    <nav className="w-full fixed bottom-0 left-0 shadow-xs border-t bg-background y sm:hidden">
      <ul className="h-20 grid grid-cols-3 gap-4">
        {navItems.map((item) => {
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
