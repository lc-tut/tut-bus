package repository

import (
	"api/internal/config"
	"api/internal/domain"

	"go.uber.org/zap"
)

type ServiceRepositoryImpl struct {
	dataDir string
	log     *zap.Logger
}

func NewServiceRepositoryImpl(cfg *config.Config, log *zap.Logger) ServiceRepositoryImpl {
	dataDir := cfg.GetDataDir()

	return ServiceRepositoryImpl{
		dataDir: dataDir,
		log:     log,
	}
}

func (r ServiceRepositoryImpl) LoadAllServices() ([]domain.ServiceData, error) {
	services, err := domain.LoadServiceData(r.dataDir)
	if err != nil {
		r.log.Error("failed to load service data", zap.Error(err))
		return nil, err
	}
	r.log.Info("service data loaded successfully from repository", zap.Int("count", len(services)))
	return services, nil
}
