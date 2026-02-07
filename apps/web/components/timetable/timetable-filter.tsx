import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimetableDisplay } from './timetable-display'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { components } from '@/generated/oas'
import { TimeFilterType } from '@/lib/types/timetable'
import { cn } from '@/lib/utils'
import { addDays, format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { FaCalendarAlt, FaClock, FaExchangeAlt, FaMapMarkerAlt, FaTimes } from 'react-icons/fa'

type DisplayBusInfo = components['schemas']['Models.BusStopGroupTimetable']

interface TimetableFilterProps {
  selectedDeparture: number | null
  setSelectedDeparture: (value: number | null) => void
  selectedDestination: number | null
  setSelectedDestination: (value: number | null) => void
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
  busStopGroups: components['schemas']['Models.BusStopGroup'][] // 追加
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
  busStopGroups, 
  filteredTimetable,        
  timetableData,            
  isLoading = false,
}: TimetableFilterProps & {
  filteredTimetable: any[]
  timetableData?: components['schemas']['Models.BusStopGroupTimetable'] | null
  isLoading?: boolean
})  {
  // 日付タブの設定
  const dateTabs = useMemo(
    () => [
      { value: 'today', label: '今日', date: now },
      { value: 'tomorrow', label: '明日', date: now ? addDays(now, 1) : null },
      { value: 'custom', label: '日付指定', date: null },
    ],
    [now]
  )

  // カレンダーのオープン状態
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false)
  const isLoadingBusStopGroups = busStopGroups.length === 0

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
                  <label className="text-sm font-medium flex items-center cursor-pointer">
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
                    className="w-full h-12"
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
                    <TabsList className="grid grid-cols-3 w-full bg-muted dark:bg-muted/80 p-1 h-auto border rounded-md">
                      {dateTabs.map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="px-3 py-2 text-xs font-medium relative rounded-md data-[state=active]:bg-background dark:data-[state=active]:shadow-sm"
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
                        'px-4 py-3 text-sm font-medium rounded-md flex items-center justify-center cursor-pointer',
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
                <div className="flex justify-between items-center mb-2 h-7">
                  <label className="text-sm font-medium flex items-center cursor-pointer">
                    <FaMapMarkerAlt className="mr-2 h-3 w-3" />
                    出発地
                  </label>
                  {(selectedDeparture !== null || selectedDestination !== null) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDeparture(null)
                        setSelectedDestination(null)
                      }}
                      className="h-7 px-2 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <FaTimes className="h-2 w-3" />
                      <span>選択を解除</span>
                    </Button>
                  )}
                </div>
                <Select
                  value={selectedDeparture !== null ? String(selectedDeparture) : ''}
                  onValueChange={(value: string) => {
                    setSelectedDeparture(value === '' ? null : Number(value))
                  }}
                  disabled={isLoadingBusStopGroups}
                >
                  <SelectTrigger
                    className={cn(
                      'rounded-md h-10 w-full cursor-pointer',
                      !selectedDeparture ? 'text-muted-foreground' : ''
                    )}
                    disabled={isLoadingBusStopGroups}
                  >
                    <div className="flex items-center w-full">
                      <SelectValue
                        placeholder={isLoadingBusStopGroups ? '読み込み中...' : '出発地を選択'}
                        className="flex-1 text-left"
                      />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingBusStopGroups ? (
                      <SelectItem value="_loading" disabled>
                        読み込み中...
                      </SelectItem>
                    ) : (
                      busStopGroups.map((group) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {group.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2 h-[28px]">
                  <label className="text-sm font-medium flex items-center cursor-pointer">
                    <FaMapMarkerAlt className="mr-2 h-3 w-3" />
                    目的地
                  </label>
                  {selectedDeparture && selectedDestination && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={swapStations}
                      className="h-7 px-2 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <FaExchangeAlt className="h-3 w-3" />
                      <span>入れ替え</span>
                    </Button>
                  )}
                </div>{' '}
                <Select
                  value={selectedDestination !== null ? String(selectedDestination) : ''}
                  onValueChange={(value: string) => {
                    if (value === '__UNSELECTED_DESTINATION__') {
                      setSelectedDestination(null)
                    } else {
                      setSelectedDestination(Number(value))
                    }
                  }}
                  disabled={isLoadingBusStopGroups}
                >
                  <SelectTrigger
                    className={cn(
                      'rounded-md h-10 w-full cursor-pointer',
                      !selectedDestination ? 'text-muted-foreground' : ''
                    )}
                    disabled={isLoadingBusStopGroups}
                  >
                    <div className="flex items-center w-full">
                      <SelectValue
                        placeholder={
                          isLoadingBusStopGroups
                            ? '読み込み中...'
                            : !selectedDeparture
                              ? '先に出発地を選択してください'
                              : '目的地を選択'
                        }
                        className="flex-1 text-left"
                      />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingBusStopGroups ? (
                      <SelectItem value="_loading" disabled>
                        読み込み中...
                      </SelectItem>
                    ) : (
                      <>
                        {selectedDeparture && (
                          <SelectItem value="__UNSELECTED_DESTINATION__">未選択</SelectItem>
                        )}
                        {busStopGroups
                          .filter(
                            (group) => selectedDeparture === null || group.id !== selectedDeparture
                          )
                          .map((group) => (
                            <SelectItem key={group.id} value={String(group.id)}>
                              {group.name}
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {/* 区切り線 */}
              <div className="border-t my-4"></div>
              {/* 時間帯設定（簡略化）*/}
              <div>
                <div className="mb-2">
                  <label className="text-sm font-medium flex items-center cursor-pointer">
                    <FaClock className="mr-2 h-3 w-3" />
                    時間帯
                  </label>
                </div>

                <Select
                  value={timeFilter}
                  onValueChange={(value: TimeFilterType) => setTimeFilter(value)}
                >
                  <SelectTrigger className="rounded-md h-10 w-full mb-4 cursor-pointer">
                    <SelectValue placeholder="すべての時間" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">
                      すべての時間
                    </SelectItem>
                    <SelectItem value="preDeparture" className="cursor-pointer">
                      出発前のみ
                    </SelectItem>
                    <SelectItem value="departure" className="cursor-pointer">
                      出発時間指定
                    </SelectItem>
                    <SelectItem value="arrival" className="cursor-pointer">
                      到着時間指定
                    </SelectItem>
                  </SelectContent>
                </Select>

                {timeFilter === 'departure' && (
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="rounded-md h-10 w-full cursor-pointer"
                    placeholder="出発時間を入力"
                  />
                )}

                {timeFilter === 'arrival' && (
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="rounded-md h-10 w-full cursor-pointer"
                    placeholder="到着時間を入力"
                  />
                )}
              </div>
            </div>
          </CardContent>
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                className="mt-2 mx-4"
                variant={'outline'}
              >
                検索
              </Button>
            </DrawerTrigger>
            <DrawerContent>
            <TimetableDisplay
              selectedDeparture={selectedDeparture}
              selectedDestination={selectedDestination}
              filteredTimetable={filteredTimetable}
              now={now}
              timetableData={timetableData}
              isLoading={isLoading}
             busStopGroups={busStopGroups}
            />
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="default" className="p-5 font-bold">
                    閉じる
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
    </Card>
  
  )
}
