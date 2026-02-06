'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/auth-client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FaHome, FaSignOutAlt, FaUser } from 'react-icons/fa'

interface AdminHeaderProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navItems = [
    { href: '/admin', label: 'ダッシュボード' },
    { href: '/admin/bus-stops', label: 'バス停' },
    { href: '/admin/services', label: '運行ダイヤ' },
  ]

  return (
    <header className="w-full flex items-center justify-between border-b h-16 shadow-sm bg-background sticky top-0 z-50">
      <Link href="/admin" className="flex justify-center items-center px-4 gap-2">
        <Image src="/tut-logo.png" alt="Logo" width={40} height={40} priority={true} />
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-bold">スクールバス</h1>
          <span className="text-xs bg-primary text-primary-foreground px-1 py-0.5 rounded">
            管理
          </span>
        </div>
      </Link>

      {/* ナビゲーション（PC） */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              pathname === item.href
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex justify-center items-center px-4">
        <Button variant="ghost" size="sm" asChild className="hidden sm:flex justify-center">
          <Link href="/" className="flex justify-center items-center">
            <FaHome className="h-4 w-4" />
            公開サイト
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <FaUser className="h-4 w-4" />
              )}
              <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* モバイル用ナビゲーション */}
            <div className="md:hidden">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <Link href="/">
                  <FaHome className="mr-2 h-4 w-4" />
                  公開サイト
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>

            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <FaSignOutAlt className="mr-2 h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
