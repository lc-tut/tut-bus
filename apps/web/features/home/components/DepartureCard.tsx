'use client'
import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FaMapMarkerAlt } from 'react-icons/fa'

interface DepartureCardProps {
  /** バス停グループ名 */
  title: string
  children: ReactNode
}

export const DepartureCard = ({ title, children }: DepartureCardProps) => (
  <Card className="w-full overflow-hidden border-muted pt-0 my-1 border-1">
    <header className="bg-blue-100/60 dark:bg-blue-950/60 px-4 py-3 min-h-[64px] flex items-center">
      <Badge
        variant="outline"
        className="mr-6 bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300 text-xs whitespace-nowrap flex items-center"
      >
        <FaMapMarkerAlt className="mr-1 size-3" />
        出発地
      </Badge>
      <h2 className="text-lg font-bold truncate">{title}</h2>
    </header>
    {children}
  </Card>
)
