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

func (h *BusStopHandler) GetBusStopTimetable(ctx echo.Context, id int32, params oapi.BusStopServiceGetBusStopTimetableParams) error {
	_, err := h.busStopUsecase.GetBusStopByID(id)
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
	dateStr := ""

	if params.Date != nil {
		dateStr = params.Date.String()
	}

	if dateStr != "" {
		t, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return ctx.JSON(http.StatusBadRequest, map[string]interface{}{
				"code":    "BadRequest",
				"message": "InvalidDate",
				"detail":  "The 'date' query must be in YYYY-MM-DD format.",
			})
		}
		date := oapi.ScalarsDateISO{}
		date.Time = t
		params.Date = &date
	} else {
		now := time.Now()
		date := oapi.ScalarsDateISO{}
		date.Time = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		params.Date = &date
	}

	timetable, err := h.busStopUsecase.GetBusStopTimetable(id, params.Date)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, timetable)
}

func (h *BusStopHandler) GetBusStopGroupsTimetable(ctx echo.Context, id int32, params oapi.BusStopGroupsServiceGetBusStopGroupsTimetableParams) error {
	_, err := h.busStopUsecase.GetBusStopGroupByID(id)
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

	dateStr := ""
	if params.Date != nil {
		dateStr = params.Date.String()
	}
	if dateStr != "" {
		t, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return ctx.JSON(http.StatusBadRequest, map[string]interface{}{
				"code":    "BadRequest",
				"message": "InvalidDate",
				"detail":  "The provided date is invalid. Please use YYYY-MM-DD format.",
			})
		}
		date := oapi.ScalarsDateISO{}
		date.Time = t
		params.Date = &date
	} else {
		now := time.Now()
		date := oapi.ScalarsDateISO{}
		date.Time = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		params.Date = &date
	}

	timetable, err := h.busStopUsecase.GetBusStopGroupTimetable(id, params.Date)
	if err != nil {
		return err
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
