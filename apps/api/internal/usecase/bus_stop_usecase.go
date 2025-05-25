package usecase

import (
	"api/internal/domain"
	"api/internal/domain/repository"
	"api/pkg/oapi"
	"time"

	"go.uber.org/zap"
)

type BusStopUseCase interface {
	GetBusStops(groupID *int32) ([]domain.BusStop, error)
	GetBusStopGroups() ([]domain.BusStopGroup, error)
	GetBusStopByID(id int32) (*domain.BusStop, error)
	GetBusStopGroupByID(id int32) (*domain.BusStopGroup, error)
	GetBusStopTimetable(busStopID int32, date *oapi.ScalarsDateISO) (*oapi.ModelsBusStopTimetable, error)
	GetBusStopGroupTimetable(groupID int32, date *oapi.ScalarsDateISO) (*oapi.ModelsBusStopGroupTimetable, error)
}

type busStopUseCase struct {
	busStopRepo repository.BusStopRepository
	serviceRepo repository.ServiceRepository
	log         *zap.Logger
	services    []domain.ServiceData
}

func NewBusStopUseCase(busStopRepo repository.BusStopRepository, serviceRepo repository.ServiceRepository, l *zap.Logger) BusStopUseCase {
	u := &busStopUseCase{
		busStopRepo: busStopRepo,
		serviceRepo: serviceRepo,
		log:         l,
	}

	services, err := u.serviceRepo.LoadAllServices()
	if err != nil {
		l.Error("failed to load service data at startup", zap.Error(err))
	} else {
		u.services = services
		l.Info("service data loaded successfully via repository", zap.Int("count", len(services)))
	}

	return u
}

func (u *busStopUseCase) GetBusStops(groupID *int32) ([]domain.BusStop, error) {
	if groupID != nil {
		busStopGroup, err := u.busStopRepo.GetBusStopGroupByID(*groupID)
		if err != nil {
			u.log.Error("failed to get bus stop group by ID", zap.Error(err), zap.Int32("groupID", *groupID))
			return nil, err
		}

		if len(busStopGroup.BusStops) == 0 {
			u.log.Warn("no bus stops found in group", zap.Int32("groupID", *groupID))
		}

		return busStopGroup.BusStops, nil
	} else {
		busStops, err := u.busStopRepo.GetAllBusStops()
		if err != nil {
			u.log.Error("failed to get all bus stops", zap.Error(err))
			return nil, err
		}

		if len(busStops) == 0 {
			u.log.Warn("no bus stops found")
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

func (u *busStopUseCase) GetBusStopByID(id int32) (*domain.BusStop, error) {
	busStop, err := u.busStopRepo.GetBusStopByID(id)
	if err != nil {
		u.log.Error("failed to get bus stop by ID", zap.Error(err), zap.Int32("id", id))
		return nil, err
	}

	return busStop, nil
}

func (u *busStopUseCase) GetBusStopGroupByID(id int32) (*domain.BusStopGroup, error) {
	busStopGroup, err := u.busStopRepo.GetBusStopGroupByID(id)
	if err != nil {
		u.log.Error("failed to get bus stop group by ID", zap.Error(err), zap.Int32("id", id))
		return nil, err
	}

	return busStopGroup, nil
}

func (u *busStopUseCase) loadServicesForBusStop(busStopID int32, date time.Time) ([]domain.ServiceData, error) {
	var relevantServices []domain.ServiceData
	for _, service := range u.services {
		if (service.From.StopID == busStopID || service.To.StopID == busStopID) && service.IsValidForDate(date) {
			relevantServices = append(relevantServices, service)
		}
	}

	return relevantServices, nil
}

func (u *busStopUseCase) loadServicesForBusStopGroup(groupID int32, date time.Time) ([]domain.ServiceData, error) {
	group, err := u.GetBusStopGroupByID(groupID)
	if err != nil {
		return nil, err
	}

	busStopIDs := make(map[int32]bool)
	for _, stop := range group.BusStops {
		busStopIDs[stop.ID] = true
	}

	var relevantServices []domain.ServiceData
	for _, service := range u.services {
		if (busStopIDs[service.From.StopID] || busStopIDs[service.To.StopID]) && service.IsValidForDate(date) {
			relevantServices = append(relevantServices, service)
		}
	}

	return relevantServices, nil
}

func (u *busStopUseCase) createBusStopSegments(services []domain.ServiceData, busStopID int32, date time.Time) []oapi.ModelsBusStopSegment {
	segments := make([]oapi.ModelsBusStopSegment, 0)

	for _, service := range services {
		if service.From.StopID != busStopID {
			continue
		}

		destination, err := u.GetBusStopByID(service.To.StopID)
		if err != nil {
			u.log.Error("failed to get destination bus stop",
				zap.Error(err),
				zap.Int32("destinationID", service.To.StopID))
			continue
		}

		for _, segmentRaw := range service.ParsedSegments {
			switch s := segmentRaw.(type) {
			case *domain.ShuttleSegment:
				if !domain.IsSegmentValidForDate(s.Condition, date) {
					continue
				}

				startTime, err := time.Parse("15:04", s.StartTime)
				if err != nil {
					u.log.Error("failed to parse start time",
						zap.Error(err),
						zap.String("startTime", s.StartTime))
					continue
				}

				endTime, err := time.Parse("15:04", s.EndTime)
				if err != nil {
					u.log.Error("failed to parse end time",
						zap.Error(err),
						zap.String("endTime", s.EndTime))
					continue
				}

				shuttleSegment := oapi.ModelsShuttleSegment{
					SegmentType: oapi.Shuttle,
					Destination: oapi.ModelsStopRef{
						StopId:   destination.ID,
						StopName: destination.Name,
						Lat:      destination.Lat,
						Lng:      destination.Lng,
					},
					StartTime: startTime.Format("15:04"),
					EndTime:   endTime.Format("15:04"),
					IntervalRange: struct {
						Max int32 `json:"max"`
						Min int32 `json:"min"`
					}{
						Min: int32(s.IntervalRange.Min),
						Max: int32(s.IntervalRange.Max),
					},
				}

				var segment oapi.ModelsBusStopSegment
				if err := segment.FromModelsShuttleSegment(shuttleSegment); err != nil {
					u.log.Error("failed to create shuttle segment",
						zap.Error(err),
						zap.Int32("busStopID", busStopID),
						zap.Int32("destinationID", service.To.StopID))
					continue
				}
				segments = append(segments, segment)

			case *domain.FixedSegment:
				if !domain.IsSegmentValidForDate(s.Condition, date) {
					continue
				}

				fixedSegment := oapi.ModelsFixedSegment{
					SegmentType: oapi.Fixed,
					Destination: oapi.ModelsStopRef{
						StopId:   destination.ID,
						StopName: destination.Name,
						Lat:      destination.Lat,
						Lng:      destination.Lng,
					},
					Times: make([]oapi.ModelsTimePair, len(s.Times)),
				}

				for i, t := range s.Times {
					fixedSegment.Times[i] = oapi.ModelsTimePair{
						Departure: t.Departure,
						Arrival:   t.Arrival,
					}
				}

				var segment oapi.ModelsBusStopSegment
				if err := segment.FromModelsFixedSegment(fixedSegment); err != nil {
					u.log.Error("failed to create fixed segment",
						zap.Error(err),
						zap.Int32("busStopID", busStopID),
						zap.Int32("destinationID", service.To.StopID))
					continue
				}
				segments = append(segments, segment)
			}
		}
	}

	return segments
}

func convertToDateTime(date *oapi.ScalarsDateISO) (time.Time, error) {
	if date == nil || date.IsZero() {
		now := time.Now()
		return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()), nil
	}

	return time.Date(
		date.Year(),
		date.Month(),
		date.Day(),
		0, 0, 0, 0,
		date.Location(),
	), nil
}

func (u *busStopUseCase) GetBusStopTimetable(busStopID int32, date *oapi.ScalarsDateISO) (*oapi.ModelsBusStopTimetable, error) {
	dateTime, err := convertToDateTime(date)
	if err != nil {
		u.log.Error("failed to parse date", zap.Error(err))
		return nil, err
	}

	busStop, err := u.GetBusStopByID(busStopID)
	if err != nil {
		return nil, err
	}

	services, err := u.loadServicesForBusStop(busStopID, dateTime)
	if err != nil {
		return nil, err
	}

	segments := u.createBusStopSegments(services, busStopID, dateTime)

	// データがないときは null ではなく空の配列を返す
	if segments == nil {
		segments = []oapi.ModelsBusStopSegment{}
	}

	var lat oapi.ScalarsLatitude
	var lon oapi.ScalarsLongitude
	if busStop.Lat != nil {
		lat = oapi.ScalarsLatitude(*busStop.Lat)
	}
	if busStop.Lng != nil {
		lon = oapi.ScalarsLongitude(*busStop.Lng)
	}

	return &oapi.ModelsBusStopTimetable{
		Id:       busStopID,
		Name:     busStop.Name,
		Lat:      lat,
		Lon:      lon,
		Date:     *date,
		Segments: segments,
	}, nil
}

func (u *busStopUseCase) GetBusStopGroupTimetable(groupID int32, date *oapi.ScalarsDateISO) (*oapi.ModelsBusStopGroupTimetable, error) {
	dateTime, err := convertToDateTime(date)
	if err != nil {
		u.log.Error("failed to parse date", zap.Error(err))
		return nil, err
	}

	group, err := u.GetBusStopGroupByID(groupID)
	if err != nil {
		return nil, err
	}

	services, err := u.loadServicesForBusStopGroup(groupID, dateTime)
	if err != nil {
		return nil, err
	}

	var segments []oapi.ModelsBusStopSegment
	for _, busStop := range group.BusStops {
		busStopSegments := u.createBusStopSegments(services, busStop.ID, dateTime)
		segments = append(segments, busStopSegments...)
	}

	return &oapi.ModelsBusStopGroupTimetable{
		Id:       groupID,
		Name:     group.Name,
		Date:     *date,
		Segments: segments,
	}, nil
}
