import "@typespec/openapi3";

namespace BusAPI.Models;

using BusAPI.Scalars;

model BusStop {
  id: int32;
  name: string;
  lat?: Latitude;
  lon?: Longitude;
}

model BusStopGroup {
  id: int32;
  name: string;
  stops: BusStop[];
}

model TimePair {
  arrival: TimeISO;
  departure: TimeISO;
}

model StopRef {
  stopId: int32;
  stopName: string;
  lat?: Latitude;
  lon?: Longitude;
}

model FixedSegment {
  segmentType: "fixed";
  destination: StopRef;
  times: TimePair[];
}

model FrequencySegment {
  segmentType: "frequency";
  destination: StopRef;
  startTime: TimeISO;
  endTime: TimeISO;
  intervalMins: int32;
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
  FrequencySegment,
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
