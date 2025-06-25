import useSWRImmutable from 'swr/immutable'
import { getBusStopGroups } from '@/service/groupTimetableService'
import type { components } from '@/generated/oas'

type BusStopGroup = components['schemas']['Models.BusStopGroup']

export const useBusStopGroups = () => {
  const {
    data = [],
    error,
    isLoading,
    mutate,
  } = useSWRImmutable<BusStopGroup[]>('/api/bus-stops/groups', getBusStopGroups, {
    suspense: true,
    revalidateOnMount: true,
  })

  return {
    busStopGroups: data,
    isLoading,
    error,
    mutate,
  }
}
