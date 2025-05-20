package domain

import (
	"api/pkg/oapi"
)

type BusStop struct {
	ID   int32    `json:"id"`
	Name string   `json:"name"`
	Lat  *float32 `json:"lat"`
	Lng  *float32 `json:"lng"`
}

func BusStopToModelBusStop(busStop BusStop) *oapi.ModelsBusStop {
	return &oapi.ModelsBusStop{
		Id:   busStop.ID,
		Name: busStop.Name,
		Lat:  busStop.Lat,
		Lng:  busStop.Lng,
	}
}

type BusStopGroup struct {
	ID       int32     `json:"id"`
	Name     string    `json:"name"`
	BusStops []BusStop `json:"bus_stops"`
}

func BusStopGroupToModelBusStopGroup(busStopGroup BusStopGroup) *oapi.ModelsBusStopGroup {
	return &oapi.ModelsBusStopGroup{
		Id:       busStopGroup.ID,
		Name:     busStopGroup.Name,
		BusStops: make([]oapi.ModelsBusStop, len(busStopGroup.BusStops)),
	}
}
