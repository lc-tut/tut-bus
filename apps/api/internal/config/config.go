package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Enviroment        string
	Host              string
	Port              int
	DataPath          string
	BusStopsFile      string
	BusStopGroupsFile string
	AllowedOrigins    []string
}

func (c *Config) GetAddr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

func (c *Config) IsDev() bool {
	return c.Enviroment == "dev" || c.Enviroment == "development"
}

func (c *Config) IsProd() bool {
	return c.Enviroment == "prod" || c.Enviroment == "production"
}

func (c *Config) GetBusStopsFilePath() string {
	return fmt.Sprintf("%s/%s", c.DataPath, c.BusStopsFile)
}

func (c *Config) GetBusStopGroupsFilePath() string {
	return fmt.Sprintf("%s/%s", c.DataPath, c.BusStopGroupsFile)
}

func (c *Config) GetDataDir() string {
	return c.DataPath
}

func LoadConfig() (*Config, error) {
	err := godotenv.Load()
	if err != nil {
		log.Printf("⚠️  No .env file found or error loading .env: %v", err)
	} else {
		log.Println("✅ .env file loaded successfully")
	}

	env := getEnv("API_ENV", "prod")
	allowedOrigins := []string{}
	if env == "dev" || env == "development" {
		allowedOrigins = []string{
			// nextjs in development
			"http://web:3000",
			"http://localhost:3000",
			// swagger ui in development
			"http://swagger:8080",
			"http://localhost:8080",
		}
	} else {
		originsStr := getEnv("CORS_ALLOWED_ORIGINS", "")
		if originsStr != "" {
			allowedOrigins = strings.Split(originsStr, ",")
		}

		for i, origin := range allowedOrigins {
			// Ensure each origin ends with a slash
			if !strings.HasSuffix(origin, "/") {
				allowedOrigins[i] = origin + "/"
			}
		}

	}
	log.Printf("Allowed Origins: %v", allowedOrigins)

	return &Config{
		Enviroment:        env,
		Host:              getEnv("HOST", "localhost"),
		Port:              getEnvAsInt("PORT", 8080),
		DataPath:          getEnv("DATA_PATH", "./data"),
		BusStopsFile:      getEnv("BUS_STOPS_FILE", "bus_stops.json"),
		BusStopGroupsFile: getEnv("BUS_STOP_GROUPS_FILE", "bus_stop_groups.json"),
		AllowedOrigins:    allowedOrigins,
	}, nil
}

func getEnv(key, defaultVal string) string {
	if val, exists := os.LookupEnv(key); exists {
		return val
	}
	return defaultVal
}

func getEnvAsInt(key string, defaultVal int) int {
	if val, exists := os.LookupEnv(key); exists {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return defaultVal
}
