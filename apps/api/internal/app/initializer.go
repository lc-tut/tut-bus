package app

import (
	"api/internal/config"
	"api/internal/domain"
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
	Services     []domain.ServiceData
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

	// サービスデータの読み込み
	services, err := domain.LoadServiceData(cfg.GetDataDir())
	if err != nil {
		logger.Error("サービスデータの読み込みに失敗しました", zap.Error(err))
	} else {
		logger.Info("サービスデータを読み込みました",
			zap.Int("サービス数", len(services)),
			zap.String("データディレクトリ", cfg.GetDataDir()))

		// 各サービスの詳細をデバッグレベルでログに出力
		for _, service := range services {
			logger.Debug("サービス詳細",
				zap.String("ID", service.ID),
				zap.String("名前", service.Name),
				zap.Int("セグメント数", len(service.ParsedSegments)))
		}
	}

	busStopRepository := repo.NewBusStopRepositoryImpl(cfg)
	serviceRepository := repo.NewServiceRepositoryImpl(cfg, logger)

	repositories := repository.Repositories{
		BusStop: busStopRepository,
		Service: serviceRepository,
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
		Services:     services,
	}
}
