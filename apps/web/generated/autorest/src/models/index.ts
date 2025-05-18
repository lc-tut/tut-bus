import * as coreClient from '@azure/core-client'

export interface ModelsBusStop {
  id: number
  name: string
  lat: number
  lon: number
}

export interface ModelsBusStopTimetable {
  busStopId: number
}

/** Optional parameters. */
export interface BusStopsGetAllBusStopsOptionalParams extends coreClient.OperationOptions {}

/** Contains response data for the getAllBusStops operation. */
export type BusStopsGetAllBusStopsResponse = ModelsBusStop[]

/** Optional parameters. */
export interface BusStopsGetBusStopTimetableOptionalParams extends coreClient.OperationOptions {}

/** Contains response data for the getBusStopTimetable operation. */
export type BusStopsGetBusStopTimetableResponse = ModelsBusStopTimetable

/** Optional parameters. */
export interface TokyoUniversityOfTechnologyBusWebAPIServiceOptionalParams
  extends coreClient.ServiceClientOptions {
  /** Overrides client endpoint. */
  endpoint?: string
}
