package usecase

import (
	"api/internal/domain/repository"

	"go.uber.org/zap"
)

type UseCases struct {
	BusStop BusStopUseCase
}

func NewUseCases(repos *repository.Repositories, logger *zap.Logger) *UseCases {
	return &UseCases{
		BusStop: NewBusStopUseCase(repos.BusStop, repos.Service, logger),
	}
}
