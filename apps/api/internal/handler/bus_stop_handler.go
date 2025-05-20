package handler

import (
	"api/internal/domain"
	"api/internal/usecase"
	"api/pkg/oapi"

	"github.com/labstack/echo/v4"
)

type BusStopHandler struct {
	busStopUsecase usecase.BusStopUseCase
}

func NewBusStopHandler(busStopUsecase usecase.BusStopUseCase) *BusStopHandler {
	return &BusStopHandler{
		busStopUsecase: busStopUsecase,
	}
}

func (h *BusStopHandler) GetBusStops(ctx echo.Context, groupID *int32) error {
	busStops, err := h.busStopUsecase.GetBusStops(groupID)
	if err != nil {
		return err
	}

	var models []oapi.ModelsBusStop
	for _, busStop := range busStops {
		model := domain.BusStopToModelBusStop(busStop)
		if model != nil {
			models = append(models, *model)
		}
	}

	return ctx.JSON(200, models)
}

func (h *BusStopHandler) GetBusStopGroups(ctx echo.Context) error {
	busStopGroups, err := h.busStopUsecase.GetBusStopGroups()
	if err != nil {
		return err
	}

	var models []oapi.ModelsBusStopGroup
	for _, busStopGroup := range busStopGroups {
		model := domain.BusStopGroupToModelBusStopGroup(busStopGroup)
		if model != nil {
			models = append(models, *model)
		}
	}

	return ctx.JSON(200, models)
}
