package postgres

import (
	"context"
	"fmt"
	"log/slog"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/tracelog"
)

// Config holds database connection configuration
type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	Database string
	SSLMode  string
}

type PgxLogger struct {
	Logger *slog.Logger
}

const (
	LogLevelDebug = "DEBUG"
	LogLevelError = "ERROR"
	LogLevelWarn  = "WARN"
)

// Log adapts the pgx log format to slog
func (l *PgxLogger) Log(ctx context.Context, level tracelog.LogLevel, msg string, data map[string]interface{}) {
	if level < tracelog.LogLevelInfo {
		return
	}

	if rawQuery, exists := data["sql"]; exists {
		if query, ok := rawQuery.(string); ok {
			data["sql"] = normalizeSQLQuery(query)
		}
	}

	args := make([]any, 0, len(data))
	for k, v := range data {
		args = append(args, k, v)
	}

	switch level {
	case tracelog.LogLevelError:
		l.Logger.Error(msg, args...)
	case tracelog.LogLevelWarn:
		l.Logger.Warn(msg, args...)
	case tracelog.LogLevelInfo:
		l.Logger.Info(msg, args...)
	case tracelog.LogLevelDebug:
		l.Logger.Debug(msg, args...)
	}
}

func normalizeSQLQuery(query string) string {
	// replace all tabs and newlines with spaces
	query = strings.ReplaceAll(query, "\t", " ")
	query = strings.ReplaceAll(query, "\n", " ")

	// remove multiple spaces
	re := regexp.MustCompile(`\s+`)
	query = re.ReplaceAllString(query, " ")

	return strings.TrimSpace(query)
}

func getLogLevel(logLevel string) tracelog.LogLevel {
	switch logLevel {
	case LogLevelDebug:
		return tracelog.LogLevelDebug
	case LogLevelWarn:
		return tracelog.LogLevelWarn
	case LogLevelError:
		return tracelog.LogLevelError
	default:
		return tracelog.LogLevelInfo
	}
}

// NewPool creates a new pgx connection pool
func NewPool(ctx context.Context, cfg Config) (*pgxpool.Pool, error) {
	connString := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Database, cfg.SSLMode,
	)

	poolConfig, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database config: %w", err)
	}

	logLevel := getLogLevel("debug")
	poolConfig.ConnConfig.Tracer = &tracelog.TraceLog{
		Logger:   &PgxLogger{Logger: slog.Default()},
		LogLevel: logLevel,
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	return pool, nil
}
