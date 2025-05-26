import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const { pathname } = request.nextUrl

  // PCかつ /timetable でも /api や内部リソースでもない場合にリダイレクト
  if (
    !isMobile &&
    !pathname.startsWith('/timetable') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    pathname !== '/favicon.ico'
  ) {
    return NextResponse.redirect(new URL('/timetable', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // API・_next・favicon を除いたすべてのパスをキャッチ
  matcher: [
    /*
      /(?!api|_next|favicon\.ico).*
      → 先頭が api, _next, favicon.ico ではない任意のパス
    */
    '/((?!api|_next|favicon\\.ico).*)',
  ],
}
