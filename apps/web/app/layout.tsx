import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import FaviconSwitcher from './favicon-switcher'
import './globals.css'

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  preload: false,
  variable: '--font-noto-sans-jp',
  display: 'swap',
  fallback: ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'sans-serif'],
})

export const metadata: Metadata = {
  title: '東京工科大学 - バスNavi',
  description: '東京工科大学のバスの時刻表や運行情報を提供するアプリです。',
}

const isProd = process.env.NODE_ENV === 'production'
const GA_ID = process.env.NEXT_PUBLIC_GA_ID!

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head />
      <body className={`${notoSansJp.variable} antialiased`}>
        {isProd && <GoogleAnalytics gaId={GA_ID} />}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FaviconSwitcher />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
