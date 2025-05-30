import "@typespec/openapi3";

namespace BusAPI.Models;

using BusAPI.Scalars;

model BusStop {
  id: int32;
  name: string;
  lat?: Latitude;
  lng?: Longitude;
}

model BusStopGroup {
  id: int32;
  name: string;
  busStops: BusStop[];
}

model TimePair {
  departure: TimeISO;
  arrival: TimeISO;
}

model StopRef {
  stopId: int32;
  stopName: string;
  lat?: Latitude;
  lng?: Longitude;
}

model FixedSegment {
  segmentType: "fixed";
  destination: StopRef;
  times: TimePair[];
}

model ShuttleSegment {
  segmentType: "shuttle";
  destination: StopRef;
  startTime: TimeISO;
  endTime: TimeISO;
  intervalRange: {
    min: int32;
    max: int32;
  };
}

@TypeSpec.OpenAPI.oneOf
union BusStopSegment {
  FixedSegment,
  ShuttleSegment,
}

model BusStopTimetable {
  id: int32;
  name: string;
  lat: Latitude;
  lon: Longitude;
  date: DateISO;
  segments: BusStopSegment[];
}

model BusStopGroupTimetable {
  id: int32;
  name: string;
  date: DateISO;
  segments: BusStopSegment[];
}
