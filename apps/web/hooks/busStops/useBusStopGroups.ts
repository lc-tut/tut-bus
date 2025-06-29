import type { components } from '@/generated/oas'
import { getBusStopGroups } from '@/service/groupTimetableService'
import useSWRImmutable from 'swr/immutable'

type BusStopGroup = components['schemas']['Models.BusStopGroup']

export const useBusStopGroups = () => {
  const {
    data = [],
    error,
    isLoading,
    mutate,
  } = useSWRImmutable<BusStopGroup[]>('/api/bus-stops/groups', getBusStopGroups, {
    revalidateOnMount: true,
  })

  return {
    busStopGroups: data,
    isLoading,
    error,
    mutate,
  }
}
