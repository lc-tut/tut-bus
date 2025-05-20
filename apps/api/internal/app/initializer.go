package app

import (
	"api/internal/config"
	"log"

	"go.uber.org/zap"
)

func Initialize() (*config.Config, *zap.Logger) {
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

	return cfg, logger
}
