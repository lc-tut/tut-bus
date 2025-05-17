"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";



export default function ConfigPage() {
  const [username, setUsername] = useState("");
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    // 設定保存処理（例: API呼び出し）
    alert("設定を保存しました");
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>設定</CardTitle>
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
          <div className="flex items-center justify-between">
            <span className="text-sm">通知を有効にする</span>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <Button className="w-full" onClick={handleSave}>
            保存
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}