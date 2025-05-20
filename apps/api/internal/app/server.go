package app

import (
	"api/internal/handler"
	"api/pkg/oapi"

	"github.com/labstack/echo/v4"
)

type Server struct {
	Handlers *handler.Handlers
}

// BusStopGroupServiceGetAllBusStopGroups implements oapi.ServerInterface.
func (s *Server) BusStopGroupServiceGetAllBusStopGroups(ctx echo.Context) error {
	return s.Handlers.BusStop.GetBusStopGroups(ctx)
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
	return s.Handlers.BusStop.GetBusStops(ctx, params.GroupId)
}

// BusStopServiceGetBusStopDetails implements oapi.ServerInterface.
func (s *Server) BusStopServiceGetBusStopDetails(ctx echo.Context, id int32) error {
	return s.Handlers.BusStop.GetBusStopDetails(ctx, id)
}

// BusStopServiceGetBusStopTimetable implements oapi.ServerInterface.
func (s *Server) BusStopServiceGetBusStopTimetable(ctx echo.Context, id int32, params oapi.BusStopServiceGetBusStopTimetableParams) error {
	panic("unimplemented")
}

var _ oapi.ServerInterface = (*Server)(nil)

func NewServer(handlers *handler.Handlers) *Server {
	return &Server{
		Handlers: handlers,
	}
}
