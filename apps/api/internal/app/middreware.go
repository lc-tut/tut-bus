package app

import (
	"api/internal/domain"
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
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

		var svcErr domain.ServiceError
		if errors.As(err, &svcErr) {
			m.log.Info("service error", zap.String("code", svcErr.Code()), zap.Error(err))
			return c.JSON(svcErr.StatusCode(), err)
		}

		m.log.Error("unexpected error", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"code":    "InternalServerError",
			"message": "Internal server error",
		})
	}
}
