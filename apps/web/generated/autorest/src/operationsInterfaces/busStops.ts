import {
  BusStopsGetAllBusStopsOptionalParams,
  BusStopsGetAllBusStopsResponse,
  BusStopsGetBusStopDetailsOptionalParams,
  BusStopsGetBusStopDetailsResponse,
  BusStopsGetBusStopTimetableOptionalParams,
  BusStopsGetBusStopTimetableResponse,
} from "../models/index.js";

/** Interface representing a BusStops. */
export interface BusStops {
  /**
   * 全バス停の一覧を取得します。
   * @param options The options parameters.
   */
  getAllBusStops(
    options?: BusStopsGetAllBusStopsOptionalParams,
  ): Promise<BusStopsGetAllBusStopsResponse>;
  /**
   * バス停の詳細について取得します。
   * @param id
   * @param options The options parameters.
   */
  getBusStopDetails(
    id: number,
    options?: BusStopsGetBusStopDetailsOptionalParams,
  ): Promise<BusStopsGetBusStopDetailsResponse>;
  /**
   * バス停の時刻表を取得します。最大で 7 日間の時刻表を取得できます。
   * @param id
   * @param dateParam
   * @param fromParam
   * @param to
   * @param options The options parameters.
   */
  getBusStopTimetable(
    id: number,
    dateParam: Date,
    fromParam: Date,
    to: Date,
    options?: BusStopsGetBusStopTimetableOptionalParams,
  ): Promise<BusStopsGetBusStopTimetableResponse>;
}
