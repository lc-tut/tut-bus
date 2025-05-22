package app

import (
	"api/internal/handler"
	"api/pkg/oapi"

	"github.com/labstack/echo/v4"
)

type Server struct {
	Handlers *handler.Handlers
}

// BusStopGroupsServiceGetAllBusStopGroups implements oapi.ServerInterface.
func (s *Server) BusStopGroupsServiceGetAllBusStopGroups(ctx echo.Context) error {
	return s.Handlers.BusStop.GetBusStopGroups(ctx)
}

// BusStopGroupsServiceGetBusStopGroupDetails implements oapi.ServerInterface.
func (s *Server) BusStopGroupsServiceGetBusStopGroupDetails(ctx echo.Context, id int32) error {
	return s.Handlers.BusStop.GetBusStopGroupDetails(ctx, id)
}

// BusStopGroupsServiceGetBusStopGroupsTimetable implements oapi.ServerInterface.
func (s *Server) BusStopGroupsServiceGetBusStopGroupsTimetable(ctx echo.Context, id int32, params oapi.BusStopGroupsServiceGetBusStopGroupsTimetableParams) error {
	panic("unimplemented")
}

// BusStopTimetableServiceGetBusStopTimetable implements oapi.ServerInterface.
func (s *Server) BusStopTimetableServiceGetBusStopTimetable(ctx echo.Context, id int32, params oapi.BusStopTimetableServiceGetBusStopTimetableParams) error {
	panic("unimplemented")
}

// BusStopGroupServiceGetAllBusStopGroups implements oapi.ServerInterface.
func (s *Server) BusStopGroupServiceGetAllBusStopGroups(ctx echo.Context) error {
	return s.Handlers.BusStop.GetBusStopGroups(ctx)
}

// BusStopServiceGetAllBusStops implements oapi.ServerInterface.
func (s *Server) BusStopServiceGetAllBusStops(ctx echo.Context, params oapi.BusStopServiceGetAllBusStopsParams) error {
	return s.Handlers.BusStop.GetBusStops(ctx, params.GroupId)
}

// BusStopServiceGetBusStopDetails implements oapi.ServerInterface.
func (s *Server) BusStopServiceGetBusStopDetails(ctx echo.Context, id int32) error {
	return s.Handlers.BusStop.GetBusStopDetails(ctx, id)
}

var _ oapi.ServerInterface = (*Server)(nil)

func NewServer(handlers *handler.Handlers) *Server {
	return &Server{
		Handlers: handlers,
	}
}
