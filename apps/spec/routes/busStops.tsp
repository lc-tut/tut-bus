import "@typespec/http";
import "@typespec/openapi3";

import "../models/transport.tsp";
import "../common/scalars.tsp";
import "../common/errors.tsp";

using Http;
using BusAPI.Models;

namespace BusAPI.Routes;

using BusAPI.Scalars;
using BusAPI.Errors;

@TypeSpec.OpenAPI.oneOf
union TimetableBadRequest {
  InvalidDateBadRequest,
}

alias InvalidDateBadRequest = BadRequest<
  "InvalidDate",
  "The 'date' query must be in YYYY-MM-DD format."
>;

alias BusStopNotFound = NotFound<"BusStopNotFound", "The requested bus stop does not exist.">;
alias BusStopGroupNotFound = NotFound<
  "BusStopGroupNotFound",
  "The requested bus stop group does not exist."
>;

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

  @get
  @route("/{id}/timetable")
  @friendlyName("Get Bus Stop Timetable")
  @doc("バス停の時刻表を取得します。複数件返却します。")
  @errorsDoc("""
      - バス停が存在しない場合 → 404 Not Found
      - 日付フォーマット不正の場合 → 400 Bad Request
      - 該当日の時刻表なし → 空配列返却
    """)
  @returnsDoc("指定日の時刻表リストを返します。")
  getBusStopTimetable(@path id: int32, @query date: DateISO): {
    @statusCode statusCode: 200;

    @doc("OK - The request was successful.")
    @body
    busStopTimetables: BusStopTimetable;
  } | {
    @statusCode statusCode: 400;

    @doc("Bad Request - The request was invalid.")
    @body
    error: TimetableBadRequest;
  } | {
    @statusCode statusCode: 404;

    @doc("Not Found - The requested bus stop was not found.")
    @body
    error: BusStopNotFound;
  };
}

@route("/bus-stop-groups")
@tag("Bus Stop Groups")
interface BusStopGroupService {
  @get
  @friendlyName("Get All Bus Stop Groups")
  @doc("全バス停グループの一覧を取得します。")
  getAllBusStopGroups(): BusStopGroup[];

  @get
  @route("/{id}")
  @friendlyName("Get Bus Stop Group Details")
  @doc("バス停グループの詳細について取得します。")
  @errorsDoc("- グループが存在しない場合 → 404 Not Found")
  getBusStopGroupDetails(@path id: int32): {
    @statusCode statusCode: 200;

    @doc("OK - The request was successful.")
    @body
    busStopGroup: BusStopGroup;
  } | {
    @statusCode statusCode: 404;

    @doc("Not Found - The requested bus stop group was not found.")
    @body
    error: BusStopGroupNotFound;
  };

  @get
  @route("/{id}/timetable")
  @friendlyName("Get Bus Stop Group Timetable")
  @doc("グループ内全停留所の時刻表をまとめて取得します。")
  @errorsDoc("""
      - グループが存在しない場合 → 404 Not Found
      - 日付フォーマット不正の場合 → 400 Bad Request
      - 該当日の時刻表なし → `segments`に空配列返却
    """)
  @returnsDoc("指定した日付の時刻表を取得します。")
  getBusStopGroupsTimetable(@path id: int32, @query date: DateISO): {
    @statusCode statusCode: 200;

    @doc("OK - The request was successful.")
    @body
    busStopTimetables: BusStopGroupTimetable[];
  } | {
    @statusCode statusCode: 400;

    @doc("Bad Request - The request was invalid.")
    @body
    error: TimetableBadRequest;
  } | {
    @statusCode statusCode: 404;

    @doc("Not Found - The requested bus stop group was not found.")
    @body
    error: BusStopGroupNotFound;
  };
}
