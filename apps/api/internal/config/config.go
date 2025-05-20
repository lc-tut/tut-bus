package config

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Enviroment string
	Host       string
	Port       int
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

func LoadConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found or error loading .env: %v", err)
	}

	return &Config{
		Enviroment: getEnv("API_ENV", "prod"),
		Host:       getEnv("HOST", "localhost"),
		Port:       getEnvAsInt("PORT", 8080),
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
