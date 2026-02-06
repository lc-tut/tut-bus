import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || ''
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const { pathname } = request.nextUrl

  // 静的ファイルやAPIはスキップ
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // 認証関連のパスはスキップ（認証フローを妨げないため）
  if (pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // 管理画面へのアクセスは認証が必要
  if (pathname.startsWith('/admin')) {
    // Better Auth は複数のCookie名を使う可能性がある
    const sessionCookie =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('__Secure-better-auth.session_token')

    if (!sessionCookie) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  // PC向けで /timetable 以外、かつ 拡張子なし の場合はリダイレクト
  // ただし、admin と auth は除外
  const isStaticFile = pathname.includes('.')
  if (
    !isMobile &&
    !pathname.startsWith('/timetable') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/~offline') &&
    pathname !== '/favicon.ico' &&
    !isStaticFile
  ) {
    return NextResponse.redirect(new URL('/timetable', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}
