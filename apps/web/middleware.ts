import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  // ルートパスへのアクセスで、モバイルデバイスでない場合は/timetableにリダイレクト
  if (request.nextUrl.pathname === '/' && !isMobile) {
    return NextResponse.redirect(new URL('/timetable', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}