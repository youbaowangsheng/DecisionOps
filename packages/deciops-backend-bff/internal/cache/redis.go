package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	client *redis.Client
}

func NewRedisClient(addr string) (*RedisClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: "",
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &RedisClient{client: client}, nil
}

// Key helpers with tenant namespace
func (r *RedisClient) Key(tenantID, key string) string {
	return fmt.Sprintf("deciops:%s:%s", tenantID, key)
}

func (r *RedisClient) Get(ctx context.Context, tenantID, key string) (string, error) {
	return r.client.Get(ctx, r.Key(tenantID, key)).Result()
}

func (r *RedisClient) Set(ctx context.Context, tenantID, key string, value interface{}, expiration time.Duration) error {
	return r.client.Set(ctx, r.Key(tenantID, key), value, expiration).Err()
}

func (r *RedisClient) Delete(ctx context.Context, tenantID, key string) error {
	return r.client.Del(ctx, r.Key(tenantID, key)).Err()
}

func (r *RedisClient) Close() error {
	return r.client.Close()
}