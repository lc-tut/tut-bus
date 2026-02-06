'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn } from '@/lib/auth-client'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { FaArrowLeft, FaGithub } from 'react-icons/fa'

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin'
  const error = searchParams.get('error')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn.social({
        provider: 'github',
        callbackURL: callbackUrl,
      })
    } catch (err) {
      console.error('サインインエラー:', err)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="w-full flex items-center justify-between border-b h-16 shadow-sm bg-background fixed top-0 left-0 z-50">
        <div className="flex items-center gap-4 px-4">
          <Image
            src="/tut-logo.png"
            alt="Logo"
            width={40}
            height={40}
            priority={true}
          />
          <h1 className="text-xl font-bold">スクールバス</h1>
        </div>
        <div className="px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <FaArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
        </div>
      </header>

      {/* コンテンツ */}
      <div className="pt-24 pb-8 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">管理者ログイン</CardTitle>
            <CardDescription>
              lc-tut組織のメンバーのみアクセスできます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                {error === 'OAuthCallback'
                  ? '認証に失敗しました。lc-tut組織のメンバーであることを確認してください。'
                  : 'ログインに失敗しました。もう一度お試しください。'}
              </div>
            )}

            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  ログイン中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FaGithub className="h-5 w-5" />
                  GitHubでログイン
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              GitHubアカウントでログインすると、
              <br />
              組織メンバーシップが自動的に確認されます
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
