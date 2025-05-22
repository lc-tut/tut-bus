package handler

import (
	"api/internal/domain"
	"api/internal/dto"
	"api/internal/usecase"
	"api/pkg/oapi"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

type BusStopHandler struct {
	busStopUsecase usecase.BusStopUseCase
}

func isValidDate(date string) bool {
	_, err := time.Parse("2006-01-02", date)
	return err == nil
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
		model := dto.DomainBusStopToModelBusStop(busStop)
		if model != nil {
			models = append(models, *model)
		}
	}

	return ctx.JSON(http.StatusOK, models)
}

func (h *BusStopHandler) GetBusStopGroups(ctx echo.Context) error {
	busStopGroups, err := h.busStopUsecase.GetBusStopGroups()
	if err != nil {
		return err
	}

	var models []oapi.ModelsBusStopGroup
	for _, busStopGroup := range busStopGroups {
		model := dto.DomainBusStopGroupToModelBusStopGroup(busStopGroup)
		if model != nil {
			models = append(models, *model)
		}
	}

	return ctx.JSON(http.StatusOK, models)
}

func (h *BusStopHandler) GetBusStopDetails(ctx echo.Context, id int32) error {
	busStop, err := h.busStopUsecase.GetBusStopByID(id)
	if err != nil {
		if _, ok := err.(*domain.NotFoundError); ok {
			return ctx.JSON(http.StatusNotFound, map[string]interface{}{
				"code":    "NotFound",
				"message": "BusStopNotFound",
				"detail":  "The requested bus stop does not exist.",
			})
		}
		return err
	}

	model := dto.DomainBusStopToModelBusStop(*busStop)
	if model == nil {
		return ctx.JSON(http.StatusNotFound, map[string]interface{}{
			"code":    "NotFound",
			"message": "BusStopNotFound",
			"detail":  "The requested bus stop does not exist.",
		})
	}

	return ctx.JSON(http.StatusOK, model)
}

func (h *BusStopHandler) GetBusStopTimetable(ctx echo.Context, id int32, date oapi.ScalarsDateISO) error {
	busStop, err := h.busStopUsecase.GetBusStopByID(id)
	if err != nil {
		if _, ok := err.(*domain.NotFoundError); ok {
			return ctx.JSON(http.StatusNotFound, map[string]interface{}{
				"code":    "NotFound",
				"message": "BusStopNotFound",
				"detail":  "The requested bus stop does not exist.",
			})
		}
		return err
	}

	if !isValidDate(date.String()) {
		return ctx.JSON(http.StatusBadRequest, map[string]interface{}{
			"code":    "BadRequest",
			"message": "InvalidDate",
			"detail":  "The provided date is invalid. Please use YYYY-MM-DD format.",
		})
	}

	timetable := oapi.ModelsBusStopTimetable{
		Id:       busStop.ID,
		Name:     busStop.Name,
		Date:     date,
		Segments: []oapi.ModelsBusStopSegment{},
	}
	if busStop.Lat != nil {
		lat := float64(*busStop.Lat)
		timetable.Lat = lat
	}
	if busStop.Lng != nil {
		lon := float64(*busStop.Lng)
		timetable.Lon = lon
	}

	return ctx.JSON(http.StatusOK, timetable)
}

func (h *BusStopHandler) GetBusStopGroupDetails(ctx echo.Context, id int32) error {
	busStopGroup, err := h.busStopUsecase.GetBusStopGroupByID(id)
	if err != nil {
		if _, ok := err.(*domain.NotFoundError); ok {
			return ctx.JSON(http.StatusNotFound, map[string]interface{}{
				"code":    "NotFound",
				"message": "BusStopGroupNotFound",
				"detail":  "The requested bus stop group does not exist.",
			})
		}
		return err
	}

	model := dto.DomainBusStopGroupToModelBusStopGroup(*busStopGroup)
	if model == nil {
		return ctx.JSON(http.StatusNotFound, map[string]interface{}{
			"code":    "NotFound",
			"message": "BusStopGroupNotFound",
			"detail":  "The requested bus stop group does not exist.",
		})
	}

	return ctx.JSON(http.StatusOK, model)
}
