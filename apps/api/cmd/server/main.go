package main

import (
	"api/internal/app"
	"api/pkg/oapi"
	"log"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	// e.Use(middleware.CORS())

	cfg, logger := app.Initialize()
	addr := cfg.GetAddr()

	server := app.NewServer(logger)

	oapi.RegisterHandlers(e, server)

	log.Println("Server running...")
	if err := e.Start(addr); err != nil {
		logger.Sugar().Fatalf("failed to start server. %+v", err)
	}
}
