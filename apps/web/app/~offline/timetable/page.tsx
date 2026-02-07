'use client'

import Header from '@/components/header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BiWifiOff } from 'react-icons/bi'
import { FaArrowLeft, FaArrowRight, FaBus, FaClock, FaMapMarkerAlt, FaTrash } from 'react-icons/fa'

// ─── 型定義 ───

interface CachedTimetable {
  id: number
  name: string
  date: string
  segments: CachedSegment[]
}

type CachedSegment = CachedFixedSegment | CachedShuttleSegment

interface CachedFixedSegment {
  segmentType: 'fixed'
  destination: { stopId: number; stopName: string }
  times: { departure: string; arrival: string }[]
}

interface CachedShuttleSegment {
  segmentType: 'shuttle'
  destination: { stopId: number; stopName: string }
  startTime: string
  endTime: string
  intervalRange: { min: number; max: number }
}

interface FlatBusEntry {
  departureTime: string
  arrivalTime: string
  destinationId: number
  destinationName: string
  segmentType: 'fixed' | 'shuttle'
  shuttleInfo?: { startTime: string; endTime: string; min: number; max: number }
}

interface CachedGroupEntry {
  groupId: string
  groupName: string
  busCount: number
  savedAt: string
  timetable: CachedTimetable | null
}

interface CachedDateEntry {
  date: string
  label: string
  groupCount: number
  totalBuses: number
}

// ─── メインコンポーネント ───

export default function OfflineTimetablePage() {
  // URL の ?date= を読み取り
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('date')
  })
  const [dates, setDates] = useState<CachedDateEntry[]>([])
  const [entries, setEntries] = useState<CachedGroupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [clearDateTarget, setClearDateTarget] = useState<string | null>(null)

  const dateLabel = useMemo(
    () => (selectedDate ? formatDateLabel(selectedDate) : null),
    [selectedDate]
  )

  // 日付選択時の処理
  const selectDate = useCallback((date: string) => {
    setSelectedDate(date)
    window.history.pushState(null, '', `/~offline/timetable?date=${date}`)
  }, [])

  // 戻る処理
  const goBack = useCallback(() => {
    setSelectedDate(null)
    window.history.pushState(null, '', '/~offline/timetable')
  }, [])

  // ブラウザの戻る/進むボタン対応
  useEffect(() => {
    const handlePopState = () => {
      const date = new URLSearchParams(window.location.search).get('date')
      setSelectedDate(date)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 日付一覧を読み込み
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    findCachedDates()
      .then((data) => {
        if (!cancelled) setDates(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clearing]) // clearing 変更時にリロード

  // 日付が選択されたらエントリを読み込み
  useEffect(() => {
    if (!selectedDate) return
    let cancelled = false
    setLoading(true)
    findCachedEntriesForDate(selectedDate)
      .then((data) => {
        if (!cancelled) setEntries(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedDate])

  // キャッシュ全削除
  const handleClearCache = useCallback(async () => {
    setClearAllOpen(false)
    setClearing(true)
    try {
      await clearTimetableCache()
      setDates([])
      setEntries([])
      setSelectedDate(null)
      window.history.replaceState(null, '', '/~offline/timetable')
    } catch {
      // ignore
    } finally {
      setClearing(false)
    }
  }, [])

  // 単一日付のキャッシュ削除
  const handleClearDateCache = useCallback(
    async (date: string) => {
      setClearDateTarget(null)
      try {
        await clearCacheForDate(date)
        // 日付一覧を再読み込み
        const updatedDates = await findCachedDates()
        setDates(updatedDates)
        // 削除した日付を表示中なら一覧に戻る
        if (selectedDate === date) {
          setSelectedDate(null)
          window.history.replaceState(null, '', '/~offline/timetable')
        }
      } catch {
        // ignore
      }
    },
    [selectedDate]
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* オフラインバナー */}
      <div className="fixed top-20 md:top-16 left-0 right-0 z-40 bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 text-xs text-center py-1.5 px-3 flex items-center justify-center gap-1.5">
        <BiWifiOff className="h-3 w-3 shrink-0" />
        <span>オフラインです ・ 保存済みデータを表示</span>
      </div>

      {/* サブヘッダー */}
      <div className="fixed top-[calc(5rem+1.5rem+0.25rem)] md:top-[calc(4rem+1.5rem+0.25rem)] left-0 right-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl flex items-center gap-2 px-4 py-2.5">
          {selectedDate ? (
            <button
              onClick={goBack}
              className="rounded-md p-1.5 -ml-1.5 hover:bg-muted transition-colors"
              aria-label="戻る"
            >
              <FaArrowLeft className="h-3.5 w-3.5" />
            </button>
          ) : (
            <a
              href="/~offline"
              className="rounded-md p-1.5 -ml-1.5 hover:bg-muted transition-colors"
              aria-label="戻る"
            >
              <FaArrowLeft className="h-3.5 w-3.5" />
            </a>
          )}
          <h1 className="text-sm font-semibold flex-1">
            {dateLabel ? `${dateLabel}の時刻表` : '保存済みの時刻表'}
          </h1>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="pt-[calc(5rem+1.5rem+0.25rem+2.75rem)] md:pt-[calc(4rem+1.5rem+0.25rem+2.75rem)] mx-auto max-w-6xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-pulse text-sm text-muted-foreground">読み込み中...</div>
          </div>
        ) : selectedDate ? (
          // ── 日付別時刻表表示 ──
          entries.length === 0 ? (
            <DateEmptyState date={dateLabel!} onBack={goBack} />
          ) : (
            <>
              {/* モバイル: カルーセル */}
              <div className="md:hidden">
                <TimetableCarousel entries={entries} />
              </div>
              {/* PC: サイドバー + テーブル */}
              <div className="hidden md:block">
                <PCTimetableView entries={entries} />
              </div>
              <p className="mt-4 mb-8 text-center text-xs text-muted-foreground">
                ※ オンラインで開いた時刻表が自動保存されます
              </p>
            </>
          )
        ) : // ── 日付選択一覧 ──
        dates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="py-4 px-4">
            <p className="text-sm text-muted-foreground mb-4">日付を選択して時刻表を確認できます</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dates.map((entry) => (
                <div key={entry.date} className="flex items-stretch gap-2">
                  <button onClick={() => selectDate(entry.date)} className="flex-1 text-left">
                    <div className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors h-full">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-950/60 p-3 shrink-0">
                        <FaBus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-base">{entry.label}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {entry.groupCount}箇所の出発地 ・ {entry.totalBuses}便
                        </p>
                      </div>
                      <span className="text-muted-foreground text-lg">›</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setClearDateTarget(entry.date)}
                    className="shrink-0 flex items-center justify-center rounded-lg border px-3 hover:bg-destructive/10 hover:border-destructive/30 transition-colors text-muted-foreground hover:text-destructive"
                    aria-label={`${entry.label}のデータを削除`}
                  >
                    <FaTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t space-y-3">
              <Button
                onClick={() => setClearAllOpen(true)}
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={clearing}
              >
                <FaTrash className="h-3 w-3 mr-2" />
                すべてのキャッシュを削除
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                ※ オンラインで開いた時刻表が自動保存されます
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 全削除確認ダイアログ */}
      <AlertDialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>すべてのキャッシュを削除</AlertDialogTitle>
            <AlertDialogDescription>
              保存済みの時刻表データをすべて削除しますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleClearCache}>
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 日付別削除確認ダイアログ */}
      <AlertDialog
        open={!!clearDateTarget}
        onOpenChange={(open) => !open && setClearDateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>データを削除</AlertDialogTitle>
            <AlertDialogDescription>
              {clearDateTarget && formatDateLabel(clearDateTarget)}
              のデータを削除しますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => clearDateTarget && handleClearDateCache(clearDateTarget)}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── 空状態 ───

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FaClock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium mb-2">保存されたデータがありません</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        オンラインの状態で時刻表を開くと、自動的にデータが保存されます。
      </p>
      <Button asChild variant="outline" className="mt-6">
        <a href="/~offline">戻る</a>
      </Button>
    </div>
  )
}

function DateEmptyState({ date, onBack }: { date: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FaClock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium mb-2">{date}のデータがありません</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        オンラインの状態でこの日付の時刻表を開くと、自動的にデータが保存されます。
      </p>
      <Button onClick={onBack} variant="outline" className="mt-6">
        日付一覧に戻る
      </Button>
    </div>
  )
}

// ─── カルーセル ───

function TimetableCarousel({ entries }: { entries: CachedGroupEntry[] }) {
  return (
    <div className="my-2">
      <Carousel className="w-full">
        <CarouselContent className="mx-[5vw]">
          {entries.map((entry) => (
            <CarouselItem
              key={entry.groupId}
              className="basis-[90vw] px-2 flex justify-center max-w-lg"
            >
              <TimetableCard entry={entry} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}

// ─── PC用レイアウト ───

function PCTimetableView({ entries }: { entries: CachedGroupEntry[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = entries[selectedIdx]

  return (
    <div className="grid grid-cols-[280px_1fr] gap-6 py-4 px-6">
      {/* サイドバー: 出発地一覧 */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          出発地
        </h3>
        {entries.map((entry, idx) => (
          <button
            key={entry.groupId}
            onClick={() => setSelectedIdx(idx)}
            className={cn(
              'w-full text-left rounded-lg border p-3 transition-colors',
              idx === selectedIdx
                ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/60 dark:border-blue-700'
                : 'hover:bg-muted/50'
            )}
          >
            <div className="font-semibold text-sm truncate">{entry.groupName}</div>
            {entry.timetable ? (
              <div className="text-xs text-muted-foreground mt-0.5">
                {entry.busCount}便{entry.savedAt && ` ・ ${entry.savedAt} に保存`}
              </div>
            ) : (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">データなし</div>
            )}
          </button>
        ))}
      </div>

      {/* メイン: 選択された出発地の時刻表 */}
      <div>
        <TimetableCard key={selected.groupId} entry={selected} fullTable />
      </div>
    </div>
  )
}

// ─── 出発地カード ───

function TimetableCard({
  entry,
  fullTable = false,
}: {
  entry: CachedGroupEntry
  fullTable?: boolean
}) {
  if (!entry.timetable) {
    return (
      <Card className="w-full overflow-hidden border-muted pt-0 my-1 block border border-gray">
        <div className="bg-blue-100/60 dark:bg-blue-950/60 px-4 py-3 min-h-[64px] flex items-center">
          <div className="flex items-center w-full">
            <Badge
              variant="outline"
              className="mr-6 bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300 text-xs whitespace-nowrap flex items-center"
            >
              <FaMapMarkerAlt className="mr-1 size-3" />
              出発地
            </Badge>
            <h2 className="text-lg font-bold truncate">{entry.groupName}</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/40 p-4 mb-4">
            <BiWifiOff className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
          </div>
          <p className="text-sm font-medium">データなし</p>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs">
            この出発地の時刻表はキャッシュされていません。
            <br />
            オンライン時にこの出発地を表示すると保存されます。
          </p>
        </div>
      </Card>
    )
  }

  return <TimetableCardWithData entry={entry} timetable={entry.timetable} fullTable={fullTable} />
}

function TimetableCardWithData({
  entry,
  timetable,
  fullTable = false,
}: {
  entry: CachedGroupEntry
  timetable: CachedTimetable
  fullTable?: boolean
}) {
  const flatEntries = useMemo(() => flattenTimetable(timetable), [timetable])

  const destinations = useMemo(() => {
    const map = new Map<number, { stopId: number; stopName: string }>()
    for (const seg of timetable.segments) {
      const id = seg.destination.stopId
      if (!map.has(id)) {
        map.set(id, { stopId: id, stopName: seg.destination.stopName })
      }
    }
    return Array.from(map.values())
  }, [timetable])

  const [selectedDest, setSelectedDest] = useState<number | null>(
    destinations.length === 1 ? destinations[0].stopId : null
  )

  const filteredEntries = useMemo(() => {
    if (!selectedDest) return flatEntries
    return flatEntries.filter((e) => e.destinationId === selectedDest)
  }, [flatEntries, selectedDest])

  return (
    <Card className="w-full overflow-hidden border-muted pt-0 my-1 block border border-gray">
      {/* 出発地ヘッダー */}
      <div className="bg-blue-100/60 dark:bg-blue-950/60 px-4 py-3 min-h-[64px] flex items-center">
        <div className="flex items-center w-full">
          <Badge
            variant="outline"
            className="mr-6 bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300 text-xs whitespace-nowrap flex items-center"
          >
            <FaMapMarkerAlt className="mr-1 size-3" />
            出発地
          </Badge>
          <h2 className="text-lg font-bold truncate">{entry.groupName}</h2>
        </div>
      </div>

      {/* 行き先セレクター */}
      {destinations.length > 0 && (
        <div className="px-4 py-3 bg-green-100/80 dark:bg-green-950/60 min-h-[64px] flex items-center">
          <div className="flex items-center w-full">
            <Badge
              variant="outline"
              className="mr-6 bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300 text-xs whitespace-nowrap flex items-center"
            >
              <FaArrowRight className="mr-1 size-3" />
              行先
            </Badge>

            {destinations.length === 1 ? (
              <div className="min-h-[36px] h-9 flex items-center py-1">
                <h2 className="text-lg font-semibold truncate">{destinations[0].stopName}</h2>
              </div>
            ) : (
              <Select
                value={selectedDest?.toString() || ''}
                onValueChange={(v) => setSelectedDest(parseInt(v, 10))}
              >
                <SelectTrigger className="w-full text-lg h-9 py-1 min-h-[36px] bg-background">
                  {selectedDest ? (
                    <span className="truncate font-bold">
                      {destinations.find((d) => d.stopId === selectedDest)?.stopName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      行先を選択（{destinations.length}件）
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent className="max-w-[350px]">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                    行先を選択してください（{destinations.length}件）
                  </div>
                  {destinations.map((dest, idx) => (
                    <SelectItem key={idx} value={String(dest.stopId)} className="text-sm py-2">
                      <div className="flex items-center w-full">
                        <span className="truncate">{dest.stopName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      {/* 保存情報 */}
      {entry.savedAt && (
        <div className="px-4 py-1.5 text-xs text-muted-foreground border-b bg-muted/30">
          {entry.busCount}便 ・ {entry.savedAt} に保存
        </div>
      )}

      {/* 時刻表テーブル */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FaClock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {!selectedDest && destinations.length > 1
              ? '行先を選択してください'
              : '時刻表データがありません'}
          </p>
        </div>
      ) : (
        <OfflineTimetableTable entries={filteredEntries} fullTable={fullTable} />
      )}
    </Card>
  )
}

// ─── テーブル表示 ───

function OfflineTimetableTable({
  entries,
  fullTable = false,
}: {
  entries: FlatBusEntry[]
  fullTable?: boolean
}) {
  const displayEntries = fullTable ? entries : entries.slice(0, 3)

  return (
    <div className="flex-1 flex flex-col min-h-[210px] justify-between">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs md:text-sm font-medium pl-4 md:pl-6">目的地</TableHead>
            <TableHead className="text-xs md:text-sm font-medium">出発時刻</TableHead>
            <TableHead className="text-xs md:text-sm font-medium hidden md:table-cell">
              到着時刻
            </TableHead>
            <TableHead className="text-right text-xs font-medium"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEntries.map((bus, idx) => (
            <OfflineBusRow key={idx} bus={bus} />
          ))}
        </TableBody>
      </Table>

      {!fullTable && entries.length > 3 && (
        <Drawer
          onOpenChange={(open) => {
            if (open) (document.activeElement as HTMLElement)?.blur()
          }}
        >
          <DrawerTrigger asChild>
            <Button className="mt-2 mx-4" variant="outline">
              以降の時刻表を表示
            </Button>
          </DrawerTrigger>
          <DrawerContent className="min-h-[400px] max-h-[60vh]">
            <DrawerTitle className="sr-only">時刻表一覧</DrawerTitle>
            <DrawerDescription className="sr-only">すべての時刻表データを表示します</DrawerDescription>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm font-medium pl-4 md:pl-6">
                    目的地
                  </TableHead>
                  <TableHead className="text-xs md:text-sm font-medium">出発時刻</TableHead>
                  <TableHead className="text-xs md:text-sm font-medium hidden md:table-cell">
                    到着時刻
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((bus, idx) => (
                  <OfflineBusRow key={idx} bus={bus} />
                ))}
              </TableBody>
            </Table>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="default" className="p-5 font-bold">
                  閉じる
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}

// ─── バス行 ───

function OfflineBusRow({ bus }: { bus: FlatBusEntry }) {
  const isShuttle = bus.segmentType === 'shuttle'
  return (
    <TableRow
      className={cn(
        'hover:bg-muted/50 text-base py-1.5 font-semibold',
        isShuttle && 'bg-purple-50/80 dark:bg-purple-950/30'
      )}
    >
      <TableCell
        className={cn(
          'text-xs md:text-sm',
          isShuttle &&
            'bg-purple-100/40 dark:bg-purple-900/40 border-l-2 border-purple-500 dark:border-purple-600'
        )}
      >
        <div className="flex items-center gap-1.5 pl-2 md:pl-4">
          <span className={isShuttle ? 'font-medium text-purple-700 dark:text-purple-300' : ''}>
            {bus.destinationName}
          </span>
        </div>
      </TableCell>

      <TableCell
        className={cn('text-xs md:text-sm', isShuttle && 'bg-purple-100/40 dark:bg-purple-900/40')}
      >
        {isShuttle && bus.shuttleInfo ? (
          <div className="flex items-start flex-col sm:flex-row">
            {bus.shuttleInfo.startTime}&nbsp;~&nbsp;{bus.shuttleInfo.endTime}
          </div>
        ) : (
          <span>{bus.departureTime}</span>
        )}
      </TableCell>

      {/* 到着時刻: PC専用列 */}
      <TableCell
        className={cn(
          'hidden md:table-cell text-sm',
          isShuttle && 'bg-purple-100/40 dark:bg-purple-900/40'
        )}
      >
        {!isShuttle && bus.arrivalTime && <span>{bus.arrivalTime}</span>}
      </TableCell>

      <TableCell
        className={cn('text-right', isShuttle && 'bg-purple-100/40 dark:bg-purple-900/40')}
      >
        {isShuttle && bus.shuttleInfo ? (
          <Badge
            variant="secondary"
            className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
          >
            <FaBus className="mr-1 h-2.5 w-2.5" />
            {bus.shuttleInfo.min === bus.shuttleInfo.max
              ? `約${bus.shuttleInfo.min}分間隔`
              : `約${bus.shuttleInfo.min}〜${bus.shuttleInfo.max}分間隔`}
          </Badge>
        ) : bus.arrivalTime ? (
          <Badge variant="outline" className="text-xs md:hidden">
            {bus.arrivalTime} 着
          </Badge>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

// ─── ユーティリティ ───

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
    return `${d.getMonth() + 1}月${d.getDate()}日（${weekday}）`
  } catch {
    return dateStr
  }
}

// ─── Cache Storage ユーティリティ ───

/** キャッシュから保存済みの日付一覧を取得（0便の日付は除外） */
async function findCachedDates(): Promise<CachedDateEntry[]> {
  const dateMap = new Map<string, { groupIds: Set<string>; totalBuses: number }>()
  const cacheNames = await caches.keys()

  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()

    for (const req of keys) {
      const url = new URL(req.url)
      if (
        !url.pathname.startsWith('/api/bus-stops/groups/') ||
        !url.pathname.includes('/timetable') ||
        !url.searchParams.has('date')
      ) {
        continue
      }

      const date = url.searchParams.get('date')!
      const match = url.pathname.match(/\/api\/bus-stops\/groups\/(\d+)\/timetable/)
      if (!match) continue
      const groupId = match[1]

      const res = await cache.match(req)
      if (!res || !res.ok) continue

      let busCount = 0
      try {
        const data = await res.clone().json()
        if (data?.segments) {
          for (const seg of data.segments) {
            if (seg.segmentType === 'fixed') {
              busCount += seg.times?.length ?? 0
            } else {
              busCount += 1
            }
          }
        }
      } catch {
        continue
      }

      if (!dateMap.has(date)) {
        dateMap.set(date, { groupIds: new Set(), totalBuses: 0 })
      }
      const entry = dateMap.get(date)!
      // busCount が 0 のグループはカウントしない
      if (busCount > 0) {
        entry.groupIds.add(groupId)
      }
      entry.totalBuses += busCount
    }
  }

  return (
    [...dateMap.entries()]
      // totalBuses が 0 の日付は除外
      .filter(([, info]) => info.totalBuses > 0)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, info]) => ({
        date,
        label: formatDateLabel(date),
        groupCount: info.groupIds.size,
        totalBuses: info.totalBuses,
      }))
  )
}

/** 指定日付のキャッシュ済みエントリを取得 */
async function findCachedEntriesForDate(date: string): Promise<CachedGroupEntry[]> {
  const entries: CachedGroupEntry[] = []
  const seen = new Set<string>()

  const allGroups = await getAllCachedGroups()

  const cacheNames = await caches.keys()
  const foundGroupIds = new Set<string>()

  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()

    for (const req of keys) {
      const url = new URL(req.url)
      if (
        !url.pathname.startsWith('/api/bus-stops/groups/') ||
        !url.pathname.includes('/timetable') ||
        url.searchParams.get('date') !== date
      ) {
        continue
      }

      const match = url.pathname.match(/\/api\/bus-stops\/groups\/(\d+)\/timetable/)
      if (!match) continue
      const groupId = match[1]

      const key = `${date}:${groupId}`
      if (seen.has(key)) continue
      seen.add(key)

      const res = await cache.match(req)
      if (!res || !res.ok) continue

      let savedAt = ''
      const cachedAt = res.headers.get('x-sw-cached-at')
      if (cachedAt) {
        try {
          const d = new Date(cachedAt)
          savedAt = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
        } catch {
          // ignore
        }
      }

      let timetable: CachedTimetable
      try {
        timetable = (await res.clone().json()) as CachedTimetable
      } catch {
        continue
      }

      const groupName = timetable.name ?? ''
      const busCount = countBuses(timetable)

      foundGroupIds.add(groupId)
      entries.push({ groupId, groupName, busCount, savedAt, timetable })
    }
  }

  // キャッシュされていないグループを「データなし」として追加
  for (const group of allGroups) {
    if (!foundGroupIds.has(String(group.id))) {
      entries.push({
        groupId: String(group.id),
        groupName: group.name,
        busCount: 0,
        savedAt: '',
        timetable: null,
      })
    }
  }

  return entries.sort((a, b) => {
    if (a.timetable && !b.timetable) return -1
    if (!a.timetable && b.timetable) return 1
    return a.groupName.localeCompare(b.groupName)
  })
}

async function getAllCachedGroups(): Promise<{ id: number; name: string }[]> {
  try {
    const cache = await caches.open('bus-timetable-api')
    const keys = await cache.keys()
    const groupsKey = keys.find((req) => {
      const url = new URL(req.url)
      return (
        url.pathname === '/api/bus-stops/groups' || url.pathname.endsWith('/api/bus-stops/groups')
      )
    })
    if (groupsKey) {
      const res = await cache.match(groupsKey)
      if (res && res.ok) {
        return (await res.json()) as { id: number; name: string }[]
      }
    }
  } catch {
    // ignore
  }
  return []
}

/** 時刻表関連のキャッシュをすべて削除 */
async function clearTimetableCache(): Promise<void> {
  // bus-timetable-api キャッシュを丸ごと削除
  await caches.delete('bus-timetable-api')
}

/** 特定日付のキャッシュエントリのみ削除 */
async function clearCacheForDate(date: string): Promise<void> {
  const cacheNames = await caches.keys()
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    for (const req of keys) {
      const url = new URL(req.url)
      if (
        url.pathname.startsWith('/api/bus-stops/groups/') &&
        url.pathname.includes('/timetable') &&
        url.searchParams.get('date') === date
      ) {
        await cache.delete(req)
      }
    }
  }
}

function countBuses(data: CachedTimetable): number {
  let count = 0
  for (const seg of data.segments) {
    if (seg.segmentType === 'fixed') {
      count += seg.times.length
    } else {
      count += 1
    }
  }
  return count
}

function flattenTimetable(data: CachedTimetable): FlatBusEntry[] {
  const entries: FlatBusEntry[] = []

  for (const seg of data.segments) {
    if (seg.segmentType === 'fixed') {
      for (const time of seg.times) {
        entries.push({
          departureTime: time.departure,
          arrivalTime: time.arrival,
          destinationId: seg.destination.stopId,
          destinationName: seg.destination.stopName,
          segmentType: 'fixed',
        })
      }
    } else if (seg.segmentType === 'shuttle') {
      entries.push({
        departureTime: seg.startTime,
        arrivalTime: seg.endTime,
        destinationId: seg.destination.stopId,
        destinationName: seg.destination.stopName,
        segmentType: 'shuttle',
        shuttleInfo: {
          startTime: seg.startTime,
          endTime: seg.endTime,
          min: seg.intervalRange.min,
          max: seg.intervalRange.max,
        },
      })
    }
  }

  entries.sort((a, b) => {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }
    return toMin(a.departureTime) - toMin(b.departureTime)
  })

  return entries
}
