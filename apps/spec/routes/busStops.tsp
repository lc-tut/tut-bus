import "@typespec/http";

import "../models/busStop.tsp";

using Http;
using BusAPI.Models;

namespace BusAPI;

@route("/bus-stops")
@tag("Bus Stops")
interface BusStops {
  @get
  @friendlyName("Get All Bus Stops")
  @doc("全バス停の一覧を取得します。")
  getAllBusStops(): BusStop[];

  @get
  @friendlyName("Get Bus Stop Timetable")
  @doc("バス停の時刻表を取得します。")
  @route("/{id}")
  getBusStopTimetable(@path id: string): BusStopTimetable;
}
