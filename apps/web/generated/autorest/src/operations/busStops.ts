import { BusStops } from '../operationsInterfaces/index.js'
import * as coreClient from '@azure/core-client'
import * as Mappers from '../models/mappers.js'
import * as Parameters from '../models/parameters.js'
import { TokyoUniversityOfTechnologyBusWebAPIService } from '../tokyoUniversityOfTechnologyBusWebAPIService.js'
import {
  BusStopsGetAllBusStopsOptionalParams,
  BusStopsGetAllBusStopsResponse,
  BusStopsGetBusStopTimetableOptionalParams,
  BusStopsGetBusStopTimetableResponse,
} from '../models/index.js'

/** Class containing BusStops operations. */
export class BusStopsImpl implements BusStops {
  private readonly client: TokyoUniversityOfTechnologyBusWebAPIService

  /**
   * Initialize a new instance of the class BusStops class.
   * @param client Reference to the service client
   */
  constructor(client: TokyoUniversityOfTechnologyBusWebAPIService) {
    this.client = client
  }

  /**
   * 全バス停の一覧を取得します。
   * @param options The options parameters.
   */
  getAllBusStops(
    options?: BusStopsGetAllBusStopsOptionalParams
  ): Promise<BusStopsGetAllBusStopsResponse> {
    return this.client.sendOperationRequest({ options }, getAllBusStopsOperationSpec)
  }

  /**
   * バス停の時刻表を取得します。
   * @param id
   * @param options The options parameters.
   */
  getBusStopTimetable(
    id: string,
    options?: BusStopsGetBusStopTimetableOptionalParams
  ): Promise<BusStopsGetBusStopTimetableResponse> {
    return this.client.sendOperationRequest({ id, options }, getBusStopTimetableOperationSpec)
  }
}
// Operation Specifications
const serializer = coreClient.createSerializer(Mappers, /* isXml */ false)

const getAllBusStopsOperationSpec: coreClient.OperationSpec = {
  path: '/api/bus-stops',
  httpMethod: 'GET',
  responses: {
    200: {
      bodyMapper: {
        type: {
          name: 'Sequence',
          element: { type: { name: 'Composite', className: 'ModelsBusStop' } },
        },
      },
    },
  },
  urlParameters: [Parameters.$host],
  headerParameters: [Parameters.accept],
  serializer,
}
const getBusStopTimetableOperationSpec: coreClient.OperationSpec = {
  path: '/api/bus-stops/{id}',
  httpMethod: 'GET',
  responses: {
    200: {
      bodyMapper: Mappers.ModelsBusStopTimetable,
    },
  },
  urlParameters: [Parameters.$host, Parameters.id],
  headerParameters: [Parameters.accept],
  serializer,
}
