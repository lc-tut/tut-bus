package app

type Middleware struct{}

// Sample
// func (m *Middleware) AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
// 	return func(c echo.Context) error {
// 		userIDStr := c.Request().Header.Get("X-User-ID")
// 		userID, _ := strconv.Atoi(userIDStr)
// 		if _, err := m.UserRepo.FindByID(userID); err != nil {
// 			return echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
// 		}
// 		return next(c)
// 	}
// }
