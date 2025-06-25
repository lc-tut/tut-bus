import { client } from '@/lib/client'
import { format } from 'date-fns'
import type { components, operations } from '@/generated/oas'

export const getBusStopGroups = async (): Promise<
  components['schemas']['Models.BusStopGroup'][]
> => {
  const { data, error } = await client.GET('/api/bus-stops/groups')
  if (error || !data) throw error ?? new Error('no data')
  return data
}

export const getGroupTimetable = async (
  groupId: number,
  date: Date
): Promise<components['schemas']['Models.BusStopGroupTimetable']> => {
  const params: operations['BusStopGroupsService_getBusStopGroupsTimetable']['parameters'] = {
    path: { id: groupId },
    query: { date: format(date, 'yyyy-MM-dd') },
  }
  const { data, error } = await client.GET('/api/bus-stops/groups/{id}/timetable', { params })
  if (error || !data) throw error ?? new Error('no data')
  return data
}
