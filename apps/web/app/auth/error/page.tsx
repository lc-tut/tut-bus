'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { FaExclamationTriangle, FaGithub, FaHome } from 'react-icons/fa'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    if (!error) return '不明なエラーが発生しました'

    // URLデコードされたエラーメッセージをそのまま表示
    if (error.includes('組織') || error.includes('チーム')) {
      return error
    }

    switch (error) {
      case 'OAuthCallback':
        return '認証コールバックでエラーが発生しました'
      case 'OAuthAccountNotLinked':
        return 'このメールアドレスは別のアカウントで既に使用されています'
      case 'Configuration':
        return '認証設定にエラーがあります'
      case 'AccessDenied':
        return 'アクセスが拒否されました'
      default:
        return error
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="w-full flex items-center justify-between border-b h-16 shadow-sm bg-background fixed top-0 left-0 z-50">
        <div className="flex items-center gap-4 px-4">
          <Image src="/tut-logo.png" alt="Logo" width={40} height={40} priority={true} />
          <h1 className="text-xl font-bold">スクールバス</h1>
        </div>
      </header>

      {/* コンテンツ */}
      <div className="pt-24 pb-8 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <FaExclamationTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">認証エラー</CardTitle>
            <CardDescription>ログイン中にエラーが発生しました</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-destructive/10 p-4 text-center text-sm text-destructive">
              {getErrorMessage(error)}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              この管理画面はlc-tut組織のメンバーのみアクセスできます。
              <br />
              組織に所属していることを確認してください。
            </p>

            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  <FaGithub className="mr-2 h-4 w-4" />
                  再度ログインする
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <FaHome className="mr-2 h-4 w-4" />
                  トップページへ戻る
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  )
}
