package domain

type BusStop struct {
	ID   int32    `json:"id"`
	Name string   `json:"name"`
	Lat  *float32 `json:"lat"`
	Lng  *float32 `json:"lng"`
}

type BusStopGroup struct {
	ID       int32     `json:"id"`
	Name     string    `json:"name"`
	BusStops []BusStop `json:"bus_stops"`
}
