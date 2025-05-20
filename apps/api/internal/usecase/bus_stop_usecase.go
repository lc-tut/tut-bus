package usecase

import (
	"api/internal/domain"
	"api/internal/domain/repository"

	"go.uber.org/zap"
)

type BusStopUseCase interface {
	GetBusStops(groupID *int32) ([]domain.BusStop, error)
	GetBusStopGroups() ([]domain.BusStopGroup, error)
}

type busStopUseCase struct {
	busStopRepo repository.BusStopRepository
	log         *zap.Logger
}

func NewBusStopUseCase(r repository.BusStopRepository, l *zap.Logger) BusStopUseCase {
	return &busStopUseCase{
		busStopRepo: r,
		log:         l,
	}
}

func (u *busStopUseCase) GetBusStops(groupID *int32) ([]domain.BusStop, error) {
	if groupID != nil {
		busStopGroup, err := u.busStopRepo.GetBusStopGroupByID(*groupID)
		if err != nil {
			u.log.Error("failed to get bus stop group by ID", zap.Error(err))
			return nil, err
		}

		return busStopGroup.BusStops, nil
	} else {
		busStops, err := u.busStopRepo.GetAllBusStops()
		if err != nil {
			u.log.Error("failed to get all bus stops", zap.Error(err))
			return nil, err
		}
		return busStops, nil
	}
}

func (u *busStopUseCase) GetBusStopGroups() ([]domain.BusStopGroup, error) {
	busStopGroups, err := u.busStopRepo.GetAllBusStopGroups()
	if err != nil {
		u.log.Error("failed to get bus stop groups", zap.Error(err))
		return nil, err
	}

	return busStopGroups, nil
}
