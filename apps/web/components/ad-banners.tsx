'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface AdBannerProps {
  className?: string
}

export function LinuxClubBanner({ className }: AdBannerProps) {
  return (
    <Card className={cn('overflow-hidden py-0 gap-0', className)}>
      <CardContent className="p-4 pb-0">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800">
            <Image
              src="https://avatars.githubusercontent.com/u/11837450?s=200&v=4"
              alt="LinuxClub"
              width={40}
              height={40}
              className="size-10"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base leading-tight">LinuxClub</h3>
            <p className="text-xs mt-1 text-muted-foreground leading-relaxed">
              Web開発・サーバー構築・電子工作など、IT技術に関する情報交換を行うコミュニティです。
              <br />
              気軽にXのDMから参加申請をお待ちしています。
              <br />
              <span className="font-semibold">
                （このアプリもメンバーが開発・運営しています）
              </span>
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-2 pb-4">
        <Button variant="outline" size="sm" className="w-full text-xs font-semibold" asChild>
          <Link href="https://x.com/lc_tut" target="_blank" rel="noopener noreferrer">
            外部リンク（x.com / @lc_tut)
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function SurveyBanner({ className }: AdBannerProps) {
  return (
    <Card className={cn('overflow-hidden py-0 gap-0', className)}>
      <CardContent className="p-4 pb-0">
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight">アンケート協力のお願い</h3>
          <p className="text-xs mt-1 text-muted-foreground leading-relaxed">
            いつもご利用ありがとうございます！「こんな機能がほしい」「ここが使いづらい」など、
            アプリ改善のためのご意見を募集しています。回答は匿名・約1分で完了します。
            いただいたご意見は今後のアップデートに反映させていただきます。
          </p>
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-2 pb-4">
        <Button variant="outline" size="sm" className="w-full text-xs font-semibold" asChild>
          <Link href="https://forms.gle/WYDo7gdCdWfX7D6n6" target="_blank" rel="noopener noreferrer">
            アンケートに答える
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
