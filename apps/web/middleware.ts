import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next/') || pathname === '/favicon.ico' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

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
  matcher: [
    // /api, /_next/static, /_next/image, favicon.ico を除外し、残り全パスをキャッチ
    '/((?!api|_next/static|_next/image|favicon\\.ico).*)',
  ],
};
