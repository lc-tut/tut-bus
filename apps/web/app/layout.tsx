import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import FaviconSwitcher from './favicon-switcher'
import './globals.css'

const notoSansJp = localFont({
  src: './fonts/NotoSansJP-Variable.woff2',
  variable: '--font-noto-sans-jp',
  display: 'swap',
  fallback: ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'sans-serif'],
})

export const metadata: Metadata = {
  title: '東京工科大学 - バスNavi',
  description: '東京工科大学のバスの時刻表や運行情報を提供するアプリです。',
  icons: {
    apple: '/logo-192x192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#3a4d91',
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
