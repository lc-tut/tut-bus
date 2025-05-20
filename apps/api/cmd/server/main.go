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
	appCon := app.Initialize()

	addr := appCon.Config.GetAddr()

	server := app.NewServer(appCon.Handlers)

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	// e.Use(middleware.CORS())
	e.Use(appCon.Middleware.ErrorHandlingMiddleware)

	oapi.RegisterHandlers(e, server)

	log.Println("Server running...")
	if err := e.Start(addr); err != nil {
		appCon.Logger.Sugar().Fatalf("failed to start server. %+v", err)
	}
}
