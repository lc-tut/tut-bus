import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { FaCalendarAlt, FaClock, FaExchangeAlt, FaMapMarkerAlt } from 'react-icons/fa'
import { TimeFilterType } from '@/lib/types/timetable'
import { getAvailableDepartures, getAvailableDestinations } from '@/lib/utils/timetable'

interface TimetableFilterProps {
  selectedDeparture: string
  setSelectedDeparture: (value: string) => void
  selectedDestination: string
  setSelectedDestination: (value: string) => void
  selectedDate: Date | null
  setSelectedDate: (date: Date | null) => void
  now: Date | null
  timeFilter: TimeFilterType
  setTimeFilter: React.Dispatch<React.SetStateAction<TimeFilterType>>
  startTime: string
  setStartTime: (value: string) => void
  endTime: string
  setEndTime: (value: string) => void
  swapStations: () => void
}

/**
 * 時刻表フィルターコンポーネント
 * 日付、出発地、目的地、時間帯などの検索条件を含む
 */
export function TimetableFilter({
  selectedDeparture,
  setSelectedDeparture,
  selectedDestination,
  setSelectedDestination,
  selectedDate,
  setSelectedDate,
  now,
  timeFilter,
  setTimeFilter,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  swapStations,
}: TimetableFilterProps) {
  // 日付タブの設定
  const dateTabs = useMemo(
    () => [
      { value: 'today', label: '今日', date: now },
      { value: 'tomorrow', label: '明日', date: now ? addDays(now, 1) : null },
      { value: 'custom', label: '日付指定', date: null },
    ],
    [now]
  )

  // 出発地に基づく利用可能な目的地を取得
  const availableDestinations = useMemo(() => {
    return getAvailableDestinations(selectedDeparture)
  }, [selectedDeparture])

  // 目的地に基づく利用可能な出発地を取得
  const availableDepartures = useMemo(() => {
    return getAvailableDepartures(selectedDestination)
  }, [selectedDestination])

  // カレンダーのオープン状態
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false)

  return (
    <Card className="shadow-sm overflow-hidden pt-0 gap-2">
      <CardHeader className="pb-2 pt-4 px-5 bg-muted">
        <CardTitle className="text-base font-semibold flex items-center">
          <FaMapMarkerAlt className="mr-2 h-3.5 w-3.5" />
          検索条件
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="space-y-5">
          {/* 日付選択 */}{' '}
          <div>
            <div className="mb-2">
              <label className="text-sm font-medium flex items-center">
                <FaCalendarAlt className="mr-2 h-3 w-3" />
                日付
              </label>
            </div>
            <div className="space-y-3">
              <Tabs
                value={
                  !selectedDate || !now
                    ? 'today'
                    : format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                      ? 'today'
                      : format(selectedDate, 'yyyy-MM-dd') === format(addDays(now, 1), 'yyyy-MM-dd')
                        ? 'tomorrow'
                        : 'custom'
                }
                className="w-full"
                onValueChange={(value) => {
                  if (value === 'today') {
                    // 「今日」タブを選択した場合は、今日の日付に設定
                    setSelectedDate(new Date())
                  } else if (value === 'tomorrow') {
                    // 「明日」タブを選択した場合は、明日の日付に設定
                    setSelectedDate(addDays(new Date(), 1))
                  } else if (value === 'custom') {
                    // 「日付指定」タブを選択した場合は、カレンダーを表示
                    setCalendarOpen(true)
                  }
                }}
              >
                <TabsList className="grid grid-cols-3 w-full bg-muted dark:bg-muted/80 p-1 h-auto border dark:border-slate-700 rounded-md">
                  {dateTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="px-3 py-2 text-xs font-medium relative rounded-md data-[state=active]:bg-background dark:data-[state=active]:bg-background/90 dark:data-[state=active]:border dark:data-[state=active]:border-slate-700 dark:data-[state=active]:shadow-sm"
                    >
                      {tab.value === 'today' && (
                        <span className="flex items-center gap-1.5 data-[state=active]:font-semibold dark:data-[state=active]:text-foreground/90">
                          <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></span>
                          {tab.label}
                        </span>
                      )}
                      {tab.value === 'tomorrow' && (
                        <span className="flex items-center gap-1.5 data-[state=active]:font-semibold dark:data-[state=active]:text-foreground/90">
                          <span className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
                          {tab.label}
                        </span>
                      )}
                      {tab.value === 'custom' && (
                        <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <DialogTrigger asChild>
                            <span className="flex items-center gap-1.5 cursor-pointer data-[state=active]:font-semibold dark:data-[state=active]:text-foreground/90">
                              <FaCalendarAlt className="h-3 w-3" />
                              {tab.label}
                              {selectedDate &&
                                now &&
                                format(selectedDate, 'yyyy-MM-dd') !== format(now, 'yyyy-MM-dd') &&
                                format(selectedDate, 'yyyy-MM-dd') !==
                                format(addDays(now, 1), 'yyyy-MM-dd') && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" />
                                )}
                            </span>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>日付を選択</DialogTitle>
                            </DialogHeader>
                            <div className="flex items-center justify-center">
                              <Calendar
                                mode="single"
                                selected={selectedDate ?? undefined}
                                onSelect={(date: Date | undefined) => {
                                  if (date) {
                                    setSelectedDate(date)
                                    // 日付選択後にダイアログを閉じる
                                    setCalendarOpen(false)
                                  }
                                }}
                                initialFocus
                                locale={ja}
                                className="mx-auto"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {selectedDate && now && (
                <div
                  className={cn(
                    'px-4 py-3 text-sm font-medium rounded-md flex items-center justify-center',
                    format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                      : format(selectedDate, 'yyyy-MM-dd') === format(addDays(now, 1), 'yyyy-MM-dd')
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'border'
                  )}
                >
                  <FaCalendarAlt
                    className={cn(
                      'mr-2 h-3.5 w-3.5',
                      format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                        ? 'text-green-500 dark:text-green-400'
                        : format(selectedDate, 'yyyy-MM-dd') ===
                          format(addDays(now, 1), 'yyyy-MM-dd')
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-muted-foreground'
                    )}
                  />
                  {format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                    ? `今日 ${format(selectedDate, 'M月d日(E)', { locale: ja })}`
                    : format(selectedDate, 'yyyy-MM-dd') === format(addDays(now, 1), 'yyyy-MM-dd')
                      ? `明日 ${format(selectedDate, 'M月d日(E)', { locale: ja })}`
                      : format(selectedDate, 'yyyy年M月d日(E)', { locale: ja })}
                </div>
              )}
            </div>
          </div>
          {/* 区切り線 */}
          <div className="border-t my-4"></div>
          {/* 出発地と目的地 */}
          <div>
            <div className="mb-2">
              <label className="text-sm font-medium flex items-center">
                <FaMapMarkerAlt className="mr-2 h-3 w-3" />
                出発地
              </label>
            </div>
            <Select
              value={selectedDeparture}
              onValueChange={(value) => {
                setSelectedDeparture(value)
              }}
            >
              <SelectTrigger
                className={cn(
                  'rounded-md h-10 w-full',
                  !selectedDeparture ? 'text-muted-foreground' : ''
                )}
              >
                <SelectValue
                  placeholder={
                    selectedDestination && availableDepartures.length === 0
                      ? '利用可能な出発地がありません'
                      : '出発地を選択'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableDepartures.length === 0 && selectedDestination ? (
                  <div className="py-2 px-2 text-xs text-muted-foreground text-center">
                    選択した目的地への経路がありません
                  </div>
                ) : (
                  <div>
                    {availableDepartures.map((stop) => (
                      <SelectItem key={stop.id} value={stop.id}>
                        {stop.name}
                      </SelectItem>
                    ))}
                    {availableDepartures.length === 0 && (
                      <div className="py-2 px-2 text-xs text-muted-foreground text-center">
                        利用可能な出発地がありません
                      </div>
                    )}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium flex items-center">
                <FaMapMarkerAlt className="mr-2 h-3 w-3" />
                目的地
              </label>
              {selectedDeparture && selectedDestination && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={swapStations}
                  className="h-7 px-2 rounded text-xs font-medium flex items-center gap-1"
                >
                  <FaExchangeAlt className="h-3 w-3" />
                  <span>入れ替え</span>
                </Button>
              )}
            </div>{' '}
            <Select
              value={selectedDestination}
              onValueChange={(value) => {
                // 未選択が選ばれた場合は空文字列をセット
                if (value === '__unselected__') {
                  setSelectedDestination('')
                } else {
                  setSelectedDestination(value)
                }
              }}
            >
              <SelectTrigger
                className={cn(
                  'rounded-md h-10 w-full',
                  !selectedDestination ? 'text-muted-foreground' : ''
                )}
              >
                <SelectValue
                  placeholder={
                    !selectedDeparture
                      ? '先に出発地を選択してください'
                      : availableDestinations.length === 0
                        ? '利用可能な目的地がありません'
                        : '目的地を選択'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {!selectedDeparture ? (
                  <div className="py-2 px-2 text-xs text-muted-foreground text-center">
                    先に出発地を選択してください
                  </div>
                ) : availableDestinations.length === 0 ? (
                  <div className="py-2 px-2 text-xs text-muted-foreground text-center">
                    選択した出発地からの経路がありません
                  </div>
                ) : (
                  <div>
                    <SelectItem key="__unselected__" value="__unselected__">
                      未選択
                    </SelectItem>
                    {availableDestinations.map((stop) => (
                      <SelectItem key={stop.id} value={stop.id}>
                        {stop.name}
                      </SelectItem>
                    ))}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          {/* 区切り線 */}
          <div className="border-t my-4"></div>
          {/* 時間帯設定（簡略化）*/}
          <div>
            <div className="mb-2">
              <label className="text-sm font-medium flex items-center">
                <FaClock className="mr-2 h-3 w-3" />
                時間帯
              </label>
            </div>

            <Select
              value={timeFilter}
              onValueChange={(value: TimeFilterType) => setTimeFilter(value)}
            >
              <SelectTrigger className="rounded-md h-10 w-full mb-4">
                <SelectValue placeholder="すべての時間" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての時間</SelectItem>
                <SelectItem value="preDeparture">出発前のみ</SelectItem>
                <SelectItem value="departure">出発時間指定</SelectItem>
                <SelectItem value="arrival">到着時間指定</SelectItem>
              </SelectContent>
            </Select>

            {timeFilter === 'departure' && (
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-md h-10 w-full"
                placeholder="出発時間を入力"
              />
            )}

            {timeFilter === 'arrival' && (
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-md h-10 w-full"
                placeholder="到着時間を入力"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
