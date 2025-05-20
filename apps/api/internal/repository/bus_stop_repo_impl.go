package repository

import (
	"api/internal/domain"
	"encoding/json"
	"os"
)

type BusStopRepositoryImpl struct {
}

func (r *BusStopRepositoryImpl) GetAllBusStops() ([]domain.BusStop, error) {
	JSON_FILE_PATH := "./data/bus_stops.json"

	data, err := os.ReadFile(JSON_FILE_PATH)
	if err != nil {
		return nil, err
	}

	var busStops []domain.BusStop
	err = json.Unmarshal(data, &busStops)
	if err != nil {
		return nil, err
	}

	return busStops, nil
}

func (r *BusStopRepositoryImpl) GetAllBusStopGroups() ([]domain.BusStopGroup, error) {
	JSON_FILE_PATH := "./data/bus_stop_groups.json"

	data, err := os.ReadFile(JSON_FILE_PATH)
	if err != nil {
		return nil, err
	}

	var busStopGroups []domain.BusStopGroup
	err = json.Unmarshal(data, &busStopGroups)
	if err != nil {
		return nil, err
	}

	return busStopGroups, nil
}

func (r *BusStopRepositoryImpl) GetBusStopGroupByID(id int32) (domain.BusStopGroup, error) {
	JSON_FILE_PATH := "../data/bus_stop_groups.json"

	data, err := os.ReadFile(JSON_FILE_PATH)
	if err != nil {
		return domain.BusStopGroup{}, err
	}

	var busStopGroups []domain.BusStopGroup
	err = json.Unmarshal(data, &busStopGroups)
	if err != nil {
		return domain.BusStopGroup{}, err
	}

	for _, group := range busStopGroups {
		if group.ID == id {
			return group, nil
		}
	}

	return domain.BusStopGroup{}, nil
}

func (r *BusStopRepositoryImpl) GetBusStopByID(id int32) (domain.BusStop, error) {
	JSON_FILE_PATH := "../data/bus_stops.json"

	data, err := os.ReadFile(JSON_FILE_PATH)
	if err != nil {
		return domain.BusStop{}, err
	}

	var busStops []domain.BusStop
	err = json.Unmarshal(data, &busStops)
	if err != nil {
		return domain.BusStop{}, err
	}

	for _, busStop := range busStops {
		if busStop.ID == id {
			return busStop, nil
		}
	}

	return domain.BusStop{}, nil
}
