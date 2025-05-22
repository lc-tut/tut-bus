import "@typespec/http";
import "@typespec/openapi3";

import "../models/transport.tsp";
import "../common/scalars.tsp";
import "../common/errors.tsp";

using Http;
using BusAPI.Models;

namespace BusAPI.Routes;

@route("/bus-stops")
@tag("Bus Stops")
interface BusStopService {
  @get
  @friendlyName("Get All Bus Stops")
  @doc("全バス停の一覧を取得します。オプションで group_id を指定するとグループで絞り込み可能です。")
  getAllBusStops(@query group_id?: int32): BusStop[];

  @get
  @route("/{id}")
  @friendlyName("Get Bus Stop Details")
  @doc("バス停の詳細について取得します。")
  @errorsDoc("- バス停が存在しない場合、404 Not Found エラーを返します。")
  @returnsDoc("バス停の詳細情報を取得します。")
  getBusStopDetails(@path id: int32): {
    @statusCode statusCode: 200;

    @doc("OK - The request was successful.")
    @body
    busStop: BusStop;
  } | {
    @statusCode statusCode: 404;

    @doc("Not Found - The requested bus stop was not found.")
    @body
    error: BusStopNotFound;
  };
}

// --- 時刻表APIは busStopTimetable.tsp へ分離 ---
