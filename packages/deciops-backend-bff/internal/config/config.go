package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	ServerPort   string
	EngineURL    string
	DBURL        string
	RedisURL     string
	KafkaBrokers []string
	JWTSecret    string
}

func Load() (*Config, error) {
	return &Config{
		ServerPort:   getEnv("SERVER_PORT", "8080"),
		EngineURL:    getEnv("ENGINE_URL", "http://decision-engine:8081"),
		DBURL:        getEnv("DB_URL", "postgresql://deciops:password@postgres:5432/deciops"),
		RedisURL:     getEnv("REDIS_URL", "redis://redis:6379"),
		KafkaBrokers: parseKafkaBrokers(getEnv("KAFKA_BROKERS", "localhost:9092")),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func parseKafkaBrokers(brokers string) []string {
	if brokers == "" {
		return nil
	}
	return strings.Split(brokers, ",")
}

// GetEnvInt returns an environment variable as int, or default if not set or invalid
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}