import "@typespec/http";
import "@typespec/openapi3";

import "../models/transport.tsp";
import "../common/scalars.tsp";
import "../common/errors.tsp";

using Http;
using BusAPI.Errors;

namespace BusAPI.Routes;

alias BusStopGroupNotFound = NotFound<
  "BusStopGroupNotFound",
  "The requested bus stop group does not exist."
>;

@route("/bus-stops/groups")
@tag("Bus Stop Groups")
interface BusStopGroupsService {
  @get
  @friendlyName("Get All Bus Stop Groups")
  @doc("全バス停グループの一覧を取得します。")
  getAllBusStopGroups(): BusAPI.Models.BusStopGroup[];

  @get
  @route("/{id}")
  @friendlyName("Get Bus Stop Group Details")
  @doc("バス停グループの詳細について取得します。")
  @errorsDoc("- グループが存在しない場合 → 404 Not Found")
  getBusStopGroupDetails(@path id: int32): {
    @statusCode statusCode: 200;

    @doc("OK - The request was successful.")
    @body
    busStopGroup: BusAPI.Models.BusStopGroup;
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
  getBusStopGroupsTimetable(@path id: int32, @query date: BusAPI.Scalars.DateISO): {
    @statusCode statusCode: 200;

    @doc("OK - The request was successful.")
    @body
    busStopTimetables: BusAPI.Models.BusStopGroupTimetable[];
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
