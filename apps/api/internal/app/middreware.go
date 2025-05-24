package app

import (
	"api/internal/domain"
	"api/pkg/oapi"
	"errors"
	"fmt"
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

		var notFoundErr *domain.NotFoundError
		if errors.As(err, &notFoundErr) {
			m.log.Warn("not found error", zap.Error(err))
			return c.JSON(http.StatusNotFound, map[string]string{
				"code":    "NotFound",
				"message": "Resource not found",
			})
		}

		var svcErr *domain.ServiceError
		if errors.As(err, &svcErr) {
			m.log.Error("service error", zap.String("code", svcErr.Code), zap.String("message", svcErr.Message))
			return c.JSON(http.StatusInternalServerError, svcErr)
		}

		// Handle OpenAPI validation errors (echo.HTTPError)
		var httpErr *echo.HTTPError
		if errors.As(err, &httpErr) {
			m.log.Warn("OpenAPI request validation error",
				zap.Int("status", httpErr.Code),
				zap.Any("validator_message_payload", httpErr.Message), // Log the raw payload from the validator
				zap.String("original_error_string", err.Error()))

			var errorMessageString string
			if msgStr, ok := httpErr.Message.(string); ok {
				errorMessageString = msgStr
			} else {
				errorMessageString = fmt.Sprintf("%v", httpErr.Message) // Fallback if not a string
			}

			// Return a structured JSON error response
			responseBody := map[string]string{
				"code":    http.StatusText(httpErr.Code), // e.g., "Bad Request"
				"message": errorMessageString,
			}
			return c.JSON(httpErr.Code, responseBody)
		}

		m.log.Error("unexpected error", zap.Error(err))
		// Ensure this default fallback also returns a structured JSON error
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"code":    "InternalServerError",
			"message": "An unexpected internal error occurred.", // Slightly more user-friendly message
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
