import { PwaInstallButton } from '@/components/pwa-install-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  FaBell,
  FaBolt,
  FaBus,
  FaClock,
  FaGithub,
  FaMobileAlt,
  FaRegQuestionCircle,
  FaWifi,
} from 'react-icons/fa'

export const metadata: Metadata = {
  title: 'バスNaviとは？ - 東京工科大学',
  description:
    '東京工科大学のスクールバス時刻表アプリ「バスNavi」の特徴や使い方をご紹介します。',
}

const features = [
  {
    icon: FaClock,
    title: 'リアルタイム時刻表',
    description: '今日のスクールバスの時刻表をリアルタイムで確認。出発までの残り時間もひと目でわかります。',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
  },
  {
    icon: FaBolt,
    title: '高速表示',
    description: '一度開いた時刻表は自動で保存されるので、2回目以降はサクサク表示。通信量も節約できます。',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  {
    icon: FaWifi,
    title: 'オフライン対応',
    description: '電波が安定しないキャンパス内でも、以前開いた時刻表データを使って確認できます。',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/40',
  },
  {
    icon: FaMobileAlt,
    title: 'ホーム画面に追加できる',
    description: 'スマホのホーム画面に追加すれば、普通のアプリのように使えます。アプリストアからのインストールは不要です。',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
  },
  {
    icon: FaBus,
    title: '複数バス停対応',
    description: '八王子駅・大学・学生会館など、複数のバス停の時刻表をまとめて確認できます。',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
  },
  {
    icon: FaBell,
    title: 'お知らせ機能',
    description: '臨時ダイヤや運休情報など、重要なお知らせをアプリ内でお届けする機能を今後追加予定です。',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/40',
  },
]

const faqs = [
  {
    q: 'アプリのインストールは必要ですか？',
    a: 'いいえ、ブラウザからそのまま利用できます。ホーム画面に追加すると、アプリのように起動できます。',
  },
  {
    q: '時刻表はどのくらい正確ですか？',
    a: '大学公式の時刻表データに基づいていますが、臨時ダイヤの反映にはタイムラグがある場合があります。正確な情報は公式サイトやバス停掲示をご確認ください。',
  },
  {
    q: '誰が開発していますか？',
    a: '東京工科大学のサークル「LinuxClub」のメンバーが開発・運営しています。ソースコードはGitHubで公開しています。',
  },
  {
    q: 'バグや要望を報告したい',
    a: 'アプリ内のアンケートフォームからご報告いただけます。',
  },
]

export default function WhatIsTutBusPage() {
  return (
    <div className="px-4 py-8 max-w-4xl mx-auto space-y-16">
      {/* ヒーローセクション */}
      <section className="text-center space-y-6">
        <Link href="/" className="flex justify-center">
          <Image
            src="/tut-logo.png"
            alt="バスNavi"
            width={80}
            height={80}
            className="rounded-2xl"
          />
        </Link>
        <div className="space-y-3">
          <Badge variant="secondary" className="text-xs">
            東京工科大学 非公式アプリ
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            バスNavi
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            東京工科大学のスクールバス時刻表を、
            <br className="sm:hidden" />
            いつでも・どこでも・すぐに確認できるWebアプリです。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <PwaInstallButton />
          <Button asChild size="lg" className="font-semibold">
            <Link href="/">最新の時刻表</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-semibold">
            <Link href="/timetable">時刻表を検索する</Link>
          </Button>
        </div>
      </section>

      <Separator />

      {/* 特徴セクション */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">特徴</h2>
          <p className="text-muted-foreground text-sm">
            使いやすさを追求したスクールバスアプリ
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="py-0 gap-0">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 rounded-lg p-2 ${feature.bg}`}>
                    <feature.icon className={`size-5 ${feature.color}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm">{feature.title}</h3>
                    <p className="text-xs mt-1 text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* スクリーンショット */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">画面イメージ</h2>
          <p className="text-muted-foreground text-sm">
            シンプルで直感的なデザイン
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border shadow-sm"
            >
              <Image
                src={`/screenshot-${i}.png`}
                alt={`スクリーンショット ${i}`}
                width={300}
                height={600}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">よくある質問</h2>
        </div>
        <div className="space-y-4 max-w-2xl mx-auto">
          {faqs.map((faq) => (
            <Card key={faq.q} className="py-0 gap-0">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <FaRegQuestionCircle className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm">{faq.q}</h3>
                    <p className="text-xs mt-1.5 text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* 開発チーム */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">開発</h2>
        </div>
        <Card className="py-0 gap-0 max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-xl overflow-hidden border">
                <Image
                  src="https://avatars.githubusercontent.com/u/11837450?s=200&v=4"
                  alt="LinuxClub"
                  width={64}
                  height={64}
                  className="size-16"
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">LinuxClub</h3>
                <p className="text-xs text-muted-foreground">東京工科大学 公認サークル</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Web開発・サーバー構築・電子工作など、IT技術全般の探究活動を行っています。
                このアプリもLinuxClubメンバーによって開発・運営されています。
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="outline" size="sm" className="flex-1 text-xs font-semibold" asChild>
                  <Link href="https://x.com/lc_tut" target="_blank" rel="noopener noreferrer">
                    X : @lc_tut
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs font-semibold" asChild>
                  <Link href="https://github.com/lc-tut" target="_blank" rel="noopener noreferrer">
                    <FaGithub className="mr-1" />
                    GitHub
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* フッターCTA */}
      <section className="text-center space-y-4 pb-8">
        <p className="text-muted-foreground text-sm">
          ご意見・ご要望をお聞かせください
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" size="lg" className="font-semibold">
            <Link href="https://forms.gle/WYDo7gdCdWfX7D6n6" target="_blank" rel="noopener noreferrer">
              アンケートに答える
            </Link>
          </Button>
          <Button asChild size="lg" className="font-semibold">
            <Link href="/">ホームに戻る</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
