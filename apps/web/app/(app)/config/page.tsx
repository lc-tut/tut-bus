'use client'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { userConfigAtom } from '@/store'
import { useAtom } from 'jotai'
import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ConfigPage() {
  const [userConfig, setUserConfig] = useAtom(userConfigAtom)
  const [username, setUsername] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [department, setDepartment] = useState('')

  useEffect(() => {
    // Jotaiのatomから初期値を設定
    setUsername(userConfig.username)
    setDepartment(userConfig.department)
    setNotifications(userConfig.notifications)
  }, [userConfig])

  const handleSave = () => {
    // Jotaiのatomを更新（自動的にlocalStorageに保存される）
    setUserConfig({
      username,
      department,
      notifications,
    })
    alert('設定を保存しました')
  }

  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">設定</h1>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>テーマ設定</CardTitle>
            <CardDescription>アプリの表示テーマを変更できます</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span>テーマモード</span>
            <ModeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>プロフィール設定</CardTitle>
            <CardDescription>個人情報の設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block mb-1 text-sm font-medium">ユーザー名</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名を入力"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">学部・専攻・役職</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">コンピュータサイエンス学部</SelectItem>
                  <SelectItem value="media">メディア学部</SelectItem>
                  <SelectItem value="engineering">工学部</SelectItem>
                  <SelectItem value="biology">応用生物学部</SelectItem>
                  <SelectItem value="design">デザイン学部</SelectItem>
                  <SelectItem value="health">医療保険学部</SelectItem>
                  <SelectItem value="bionics">バイオニクス専攻</SelectItem>
                  <SelectItem value="cs-major">コンピュータサイエンス専攻</SelectItem>
                  <SelectItem value="media-science">メディアサイエンス専攻</SelectItem>
                  <SelectItem value="katayanagi">片柳学園関係者</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">通知を有効にする</span>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>お問い合わせ</CardTitle>
            <CardDescription>サービスに関するお問い合わせはこちら</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <a
                href="https://twitter.com/lc_tut"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                X: @lc_tut
              </a>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={handleSave}>
          設定を保存
        </Button>
      </div>
    </div>
  )
}
