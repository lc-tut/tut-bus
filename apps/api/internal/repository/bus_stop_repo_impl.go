package repository

import (
	"api/internal/config"
	"api/internal/domain"
	"encoding/json"
	"fmt"
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

func loadData[T any](filePath string) ([]T, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file %s: %w", filePath, err)
	}
	var items []T
	if err := json.Unmarshal(data, &items); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON from %s: %w", filePath, err)
	}
	return items, nil
}

func (r BusStopRepositoryImpl) GetAllBusStops() ([]domain.BusStop, error) {
	filePath := r.config.GetBusStopsFilePath()

	return loadData[domain.BusStop](filePath)
}

func (r BusStopRepositoryImpl) GetAllBusStopGroups() ([]domain.BusStopGroup, error) {
	filePath := r.config.GetBusStopGroupsFilePath()

	return loadData[domain.BusStopGroup](filePath)
}

func (r BusStopRepositoryImpl) GetBusStopGroupByID(id int32) (*domain.BusStopGroup, error) {
	busStopGroups, err := r.GetAllBusStopGroups()
	if err != nil {
		return nil, err
	}

	for _, group := range busStopGroups {
		if group.ID == id {
			return &group, nil
		}
	}

	detail := "The requested bus stop group does not exist."
	return nil, &domain.NotFoundError{
		Code:    "NotFound",
		Message: "BusStopGroupNotFound",
		Detail:  &detail,
	}
}

func (r BusStopRepositoryImpl) GetBusStopByID(id int32) (*domain.BusStop, error) {
	busStops, err := r.GetAllBusStops()
	if err != nil {
		return nil, err
	}

	for _, busStop := range busStops {
		if busStop.ID == id {
			return &busStop, nil
		}
	}

	detail := "The requested bus stop does not exist."
	return nil, &domain.NotFoundError{
		Code:    "NotFound",
		Message: "BusStopNotFound",
		Detail:  &detail,
	}
}
