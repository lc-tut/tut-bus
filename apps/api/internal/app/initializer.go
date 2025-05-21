package app

import (
	"api/internal/config"
	"api/internal/domain/repository"
	"api/internal/handler"
	repo "api/internal/repository"
	"api/internal/usecase"
	"log"

	"go.uber.org/zap"
)

type AppContext struct {
	Config       *config.Config
	Logger       *zap.Logger
	Repositories *repository.Repositories
	UseCases     *usecase.UseCases
	Handlers     *handler.Handlers
	Middleware   *Middleware
}

func Initialize() *AppContext {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal(err)
	}

	var logger *zap.Logger
	if cfg.IsDev() {
		logger, err = zap.NewDevelopment()
	} else {
		logger, err = zap.NewProduction()
	}
	if err != nil {
		log.Fatalf("failed to initialize zap logger: %v", err)
	}

	busStopRepository := repo.NewBusStopRepositoryImpl(cfg)

	repositories := repository.Repositories{
		BusStop: busStopRepository,
	}

	useCases := usecase.NewUseCases(&repositories, logger)

	handlers := handler.NewHandlers(useCases)

	middleware := NewMiddleware(logger)

	return &AppContext{
		Config:       cfg,
		Logger:       logger,
		Repositories: &repositories,
		UseCases:     useCases,
		Handlers:     handlers,
		Middleware:   middleware,
	}
}
