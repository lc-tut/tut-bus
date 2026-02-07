import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}
