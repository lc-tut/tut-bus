namespace BusAPI.Models;

model BusStop {
  id: integer;
  name: string;
  lat: float;
  lon: float;
}

model BusStopTimetableItem {
}

model BusStopTimetable {
  id: integer;
  name: string;
  lat: float;
  lon: float;
  timetables: BusStopTimetableItem[];
}