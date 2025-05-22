package domain

type BusStop struct {
	ID   int32    `json:"id"`
	Name string   `json:"name"`
	Lat  *float64 `json:"lat"`
	Lng  *float64 `json:"lng"`
}

type BusStopGroup struct {
	ID       int32     `json:"id"`
	Name     string    `json:"name"`
	BusStops []BusStop `json:"busStops"`
}
