package handler

import "api/internal/usecase"

type Handlers struct {
	BusStop *BusStopHandler
}

func NewHandlers(useCases *usecase.UseCases) *Handlers {
	return &Handlers{
		BusStop: NewBusStopHandler(useCases.BusStop),
	}
}
