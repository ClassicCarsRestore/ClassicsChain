package queue

import "context"

type Message struct {
	Subject       string
	Data          []byte
	DeliveryCount int
}

type Publisher interface {
	Publish(ctx context.Context, subject string, data []byte) error
	Close() error
}

type Subscriber interface {
	Subscribe(ctx context.Context, subject string, handler MessageHandler) error
	Close() error
}

type MessageHandler func(ctx context.Context, msg Message) error
