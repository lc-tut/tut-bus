package app

import (
	"api/internal/handler"
	"api/internal/repository"
	"api/internal/usecase"
	"api/pkg/oapi"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type Server struct {
	BusStopHandler *handler.BusStopHandler
}

// BusStopGroupServiceGetAllBusStopGroups implements oapi.ServerInterface.
func (s *Server) BusStopGroupServiceGetAllBusStopGroups(ctx echo.Context) error {
	return s.BusStopHandler.GetBusStopGroups(ctx)
}

// BusStopGroupServiceGetBusStopGroupDetails implements oapi.ServerInterface.
func (s *Server) BusStopGroupServiceGetBusStopGroupDetails(ctx echo.Context, id int32) error {
	panic("unimplemented")
}

// BusStopGroupServiceGetBusStopGroupsTimetable implements oapi.ServerInterface.
func (s *Server) BusStopGroupServiceGetBusStopGroupsTimetable(ctx echo.Context, id int32, params oapi.BusStopGroupServiceGetBusStopGroupsTimetableParams) error {
	panic("unimplemented")
}

// BusStopServiceGetAllBusStops implements oapi.ServerInterface.
func (s *Server) BusStopServiceGetAllBusStops(ctx echo.Context, params oapi.BusStopServiceGetAllBusStopsParams) error {
	return s.BusStopHandler.GetBusStops(ctx, params.GroupId)
}

// BusStopServiceGetBusStopDetails implements oapi.ServerInterface.
func (s *Server) BusStopServiceGetBusStopDetails(ctx echo.Context, id int32) error {
	panic("unimplemented")
}

// BusStopServiceGetBusStopTimetable implements oapi.ServerInterface.
func (s *Server) BusStopServiceGetBusStopTimetable(ctx echo.Context, id int32, params oapi.BusStopServiceGetBusStopTimetableParams) error {
	panic("unimplemented")
}

var _ oapi.ServerInterface = (*Server)(nil)

func NewServer(l *zap.Logger) *Server {

	busStopRepository := repository.BusStopRepositoryImpl{}

	busStopUseCase := usecase.NewBusStopUseCase(&busStopRepository, l)

	return &Server{
		BusStopHandler: handler.NewBusStopHandler(busStopUseCase),
	}
}
