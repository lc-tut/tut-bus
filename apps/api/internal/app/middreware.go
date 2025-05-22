package app

import (
	"api/internal/domain"
	"api/pkg/oapi"
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	OAPIMiddleware "github.com/oapi-codegen/echo-middleware"
)

type Middleware struct {
	log *zap.Logger
}

func NewMiddleware(logger *zap.Logger) *Middleware {
	return &Middleware{
		log: logger,
	}
}

func (m *Middleware) ErrorHandlingMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		err := next(c)
		if err == nil {
			return nil
		}

		var svcErr *domain.ServiceError
		if errors.As(err, &svcErr) {
			m.log.Error("service error", zap.String("code", svcErr.Code), zap.String("message", svcErr.Message))
			return c.JSON(http.StatusInternalServerError, svcErr)
		}

		m.log.Error("unexpected error", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"code":    "InternalServerError",
			"message": "Internal server error",
		})
	}
}

func (m *Middleware) OpenAPIMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	swagger, err := oapi.GetSwagger()
	if err != nil {
		m.log.Error("failed to get swagger", zap.Error(err))
		return func(c echo.Context) error {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"code":    "InternalServerError",
				"message": "Internal server error",
			})
		}
	}
	return OAPIMiddleware.OapiRequestValidator(swagger)(next)
}
