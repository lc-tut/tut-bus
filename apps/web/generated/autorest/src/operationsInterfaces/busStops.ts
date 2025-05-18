import {
  BusStopsGetAllBusStopsOptionalParams,
  BusStopsGetAllBusStopsResponse,
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
   * バス停の時刻表を取得します。
   * @param id
   * @param options The options parameters.
   */
  getBusStopTimetable(
    id: string,
    options?: BusStopsGetBusStopTimetableOptionalParams,
  ): Promise<BusStopsGetBusStopTimetableResponse>;
}
