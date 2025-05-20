package dto

import (
	"api/internal/domain"
	"api/pkg/oapi"
)

func DomainBusStopToModelBusStop(busStop domain.BusStop) *oapi.ModelsBusStop {
	return &oapi.ModelsBusStop{
		Id:   busStop.ID,
		Name: busStop.Name,
		Lat:  busStop.Lat,
		Lng:  busStop.Lng,
	}
}

func DomainBusStopGroupToModelBusStopGroup(busStopGroup domain.BusStopGroup) *oapi.ModelsBusStopGroup {
	modelBusStops := make([]oapi.ModelsBusStop, 0, len(busStopGroup.BusStops))

	for _, busStop := range busStopGroup.BusStops {
		modelBusStop := DomainBusStopToModelBusStop(busStop)
		modelBusStops = append(modelBusStops, *modelBusStop)
	}

	return &oapi.ModelsBusStopGroup{
		Id:       busStopGroup.ID,
		Name:     busStopGroup.Name,
		BusStops: modelBusStops,
	}
}
