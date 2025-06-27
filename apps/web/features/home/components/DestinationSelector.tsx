'use client'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { FaArrowRight } from 'react-icons/fa'

interface Destination {
  stopId: number
  stopName: string
}

interface DestinationSelectorProps {
  destinations: Destination[]
  value: number | null
  onChange: (stopId: number) => void
}

export const DestinationSelector = ({
  destinations,
  value,
  onChange,
}: DestinationSelectorProps) => {
  if (destinations.length === 0) return null

  const single = destinations.length === 1
  const selectedLabel = destinations.find((d) => d.stopId === value)?.stopName

  return (
    <div className="px-4 py-3 bg-green-100/80 dark:bg-green-950/60 min-h-[64px] flex items-center">
      <Badge
        variant="outline"
        className="mr-6 bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300 text-xs whitespace-nowrap flex items-center"
      >
        <FaArrowRight className="mr-1 size-3" /> 行先
      </Badge>

      {single ? (
        <h2 className="text-lg font-semibold truncate">{destinations[0].stopName}</h2>
      ) : (
        <Select value={value?.toString() ?? ''} onValueChange={(v) => onChange(parseInt(v, 10))}>
          <SelectTrigger className="w-full text-lg h-9 py-1 bg-background min-h-[36px]">
            {value ? (
              <span className="truncate font-bold">{selectedLabel}</span>
            ) : (
              <span className="text-muted-foreground">行先を選択（{destinations.length}件）</span>
            )}
          </SelectTrigger>
          <SelectContent className="max-w-[350px]">
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
              行先を選択してください（{destinations.length}件）
            </div>
            {destinations.map((d) => (
              <SelectItem key={d.stopId} value={String(d.stopId)}>
                <span className="truncate">{d.stopName}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
