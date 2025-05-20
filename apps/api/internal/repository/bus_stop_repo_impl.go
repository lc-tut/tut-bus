package repository

import (
	"api/internal/config"
	"api/internal/domain"
	"encoding/json"
	"os"
)

type BusStopRepositoryImpl struct {
	config *config.Config
}

func NewBusStopRepositoryImpl(cfg *config.Config) BusStopRepositoryImpl {
	return BusStopRepositoryImpl{
		config: cfg,
	}
}

func (r *BusStopRepositoryImpl) loadJSONFile(filePath string, v interface{}) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, v)
	if err != nil {
		return err
	}

	return nil
}

func (r *BusStopRepositoryImpl) GetAllBusStops() ([]domain.BusStop, error) {
	filePath := r.config.GetBusStopsFilePath()

	var busStops []domain.BusStop
	if err := r.loadJSONFile(filePath, &busStops); err != nil {
		return nil, err
	}

	return busStops, nil
}

func (r *BusStopRepositoryImpl) GetAllBusStopGroups() ([]domain.BusStopGroup, error) {
	filePath := r.config.GetBusStopGroupsFilePath()

	var busStopGroups []domain.BusStopGroup
	if err := r.loadJSONFile(filePath, &busStopGroups); err != nil {
		return nil, err
	}

	return busStopGroups, nil
}

func (r *BusStopRepositoryImpl) GetBusStopGroupByID(id int32) (*domain.BusStopGroup, error) {
	filePath := r.config.GetBusStopGroupsFilePath()

	var busStopGroups []domain.BusStopGroup
	if err := r.loadJSONFile(filePath, &busStopGroups); err != nil {
		return nil, err
	}

	for _, group := range busStopGroups {
		if group.ID == id {
			return &group, nil
		}
	}

	return nil, domain.NotFoundError{
		Code:    "NotFound",
		Message: "resource not found",
	}
}

func (r *BusStopRepositoryImpl) GetBusStopByID(id int32) (*domain.BusStop, error) {
	filePath := r.config.GetBusStopsFilePath()

	var busStops []domain.BusStop
	if err := r.loadJSONFile(filePath, &busStops); err != nil {
		return nil, err
	}

	for _, busStop := range busStops {
		if busStop.ID == id {
			return &busStop, nil
		}
	}

	return nil, domain.NewErrBusStopNotFound(id)
}
