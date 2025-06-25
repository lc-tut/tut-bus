'use client'

import { SWRConfig } from 'swr'
import { fetcher } from '@/lib/api/fetcher'
import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export const SWRProvider = ({ children }: Props) => (
  <SWRConfig
    value={{
      fetcher,
      suspense: true,
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
    }}
  >
    {children}
  </SWRConfig>
)
