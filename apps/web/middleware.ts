import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const { pathname } = request.nextUrl

  // 静的ファイルやAPIはスキップ
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // PC向けで /timetable 以外、かつ 拡張子なし の場合はリダイレクト
  const isStaticFile = pathname.includes('.')
  if (
    !isMobile &&
    !pathname.startsWith('/timetable') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    pathname !== '/favicon.ico' &&
    !isStaticFile // ← これ追加
  ) {
    return NextResponse.redirect(new URL('/timetable', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/:path*',
  ],
};
