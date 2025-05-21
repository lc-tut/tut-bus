package repository

import "api/internal/domain"

type BusStopRepository interface {
	GetAllBusStops() ([]domain.BusStop, error)
	GetAllBusStopGroups() ([]domain.BusStopGroup, error)
	GetBusStopGroupByID(id int32) (*domain.BusStopGroup, error)
	GetBusStopByID(id int32) (*domain.BusStop, error)
}
