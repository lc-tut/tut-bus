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

alias InvalidDateBadRequest = BadRequest<
  "InvalidDate",
  "The 'date' query must be in YYYY-MM-DD format."
>;

alias InvalidRangeBadRequest = BadRequest<
  "InvalidRange",
  "Both 'from' and 'to' queries must be in YYYY-MM-DD format."
>;

alias RangeTooLongBadRequest = BadRequest<
  "RangeTooLong",
  "The requested date range exceeds 7 days."
>;

alias DateRangeExclusiveBadRequest = BadRequest<
  "DateRangeExclusive",
  "Provide either 'date' or 'from'/'to', but not both."
>;

alias FromAfterToBadRequest = BadRequest<
  "FromAfterTo",
  "The 'from' date must be on or before the 'to' date."
>;

@TypeSpec.OpenAPI.oneOf
union TimetableBadRequest {
  InvalidDateBadRequest,
  InvalidRangeBadRequest,
  RangeTooLongBadRequest,
  DateRangeExclusiveBadRequest,
  FromAfterToBadRequest,
}

alias BusStopNotFound = NotFound<"BusStopNotFound", "The requested bus stop does not exist.">;

@route("/bus-stops")
@tag("Bus Stops")
interface BusStops {
  @get
  @friendlyName("Get All Bus Stops")
  @doc("全バス停の一覧を取得します。")
  getAllBusStops(): BusStop[];

  @get
  @friendlyName("Get Bus Stop Details")
  @doc("バス停の詳細について取得します。")
  @errorsDoc("- バス停が存在しない場合、404 Not Found エラーを返します。")
  @returnsDoc("バス停の詳細情報を取得します。")
  @route("/{id}")
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
  @friendlyName("Get Bus Stop Timetable")
  @doc("バス停の時刻表を取得します。最大で 7 日間の時刻表を取得できます。")
  @errorsDoc("""
    - 指定したバス停が存在しない場合は **404 Not Found** を返します。
    - 指定した日付の時刻表が存在しない場合は、`segments` が空の配列で返されます。
    - `date` クエリが `YYYY-MM-DD` 形式でない場合は **400 Bad Request** を返します。
    - `from`・`to` クエリが `YYYY-MM-DD` 形式でない場合は **400 Bad Request** を返します。
    - `date` と `from` / `to` を同時に指定した場合は **400 Bad Request** を返します。
    - `from` と `to` を同時に指定した場合に
      - `from` が `to` より後の日付である
      - または範囲が 7 日を超えている
      場合は **400 Bad Request** を返します
    """)
  @returnsDoc("指定した日付の時刻表を取得します。")
  @route("/{id}/timetables")
  getBusStopTimetable(
    @path id: int32,
    @query date: DateISO,
    @query from: DateISO,
    @query to: DateISO,
  ): {
    @statusCode statusCode: 200;

    @doc("OK - The request was successful.")
    @body
    busStopTimetables: BusStopTimetable[];
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
