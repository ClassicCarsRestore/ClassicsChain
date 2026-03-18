package nats

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/ClassicCarsRestore/ClassicsChain/pkg/queue"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

const (
	DefaultStreamName = "ANCHOR"
	DefaultAckWait    = 30 * time.Second
	DefaultMaxDeliver = 5
)

var DefaultSubjects = []string{"anchor.>"}

type Config struct {
	URL        string
	StreamName string
	Subjects   []string
}

func (c Config) streamName() string {
	if c.StreamName != "" {
		return c.StreamName
	}
	return DefaultStreamName
}

func (c Config) subjects() []string {
	if len(c.Subjects) > 0 {
		return c.Subjects
	}
	return DefaultSubjects
}

type Publisher struct {
	nc     *nats.Conn
	js     jetstream.JetStream
	stream string
}

func NewPublisher(ctx context.Context, cfg Config) (*Publisher, error) {
	nc, err := nats.Connect(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("nats connect: %w", err)
	}

	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("jetstream init: %w", err)
	}

	streamName := cfg.streamName()
	_, err = js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
		Name:     streamName,
		Subjects: cfg.subjects(),
	})
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("create stream: %w", err)
	}

	return &Publisher{nc: nc, js: js, stream: streamName}, nil
}

func (p *Publisher) Publish(ctx context.Context, subject string, data []byte) error {
	_, err := p.js.Publish(ctx, subject, data)
	return err
}

func (p *Publisher) Close() error {
	p.nc.Close()
	return nil
}

type Subscriber struct {
	nc       *nats.Conn
	js       jetstream.JetStream
	stream   string
	contexts []jetstream.ConsumeContext
}

func NewSubscriber(ctx context.Context, cfg Config) (*Subscriber, error) {
	nc, err := nats.Connect(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("nats connect: %w", err)
	}

	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("jetstream init: %w", err)
	}

	return &Subscriber{nc: nc, js: js, stream: cfg.streamName()}, nil
}

func (s *Subscriber) Subscribe(ctx context.Context, subject string, handler queue.MessageHandler) error {
	cons, err := s.js.CreateOrUpdateConsumer(ctx, s.stream, jetstream.ConsumerConfig{
		Durable:       consumerName(subject),
		FilterSubject: subject,
		AckPolicy:     jetstream.AckExplicitPolicy,
		AckWait:       DefaultAckWait,
		MaxDeliver:    DefaultMaxDeliver,
	})
	if err != nil {
		return fmt.Errorf("create consumer for %s: %w", subject, err)
	}

	cc, err := cons.Consume(func(msg jetstream.Msg) {
		deliveryCount := 1
		if meta, err := msg.Metadata(); err == nil {
			deliveryCount = int(meta.NumDelivered)
		}

		qMsg := queue.Message{
			Subject:       msg.Subject(),
			Data:          msg.Data(),
			DeliveryCount: deliveryCount,
		}

		if err := handler(ctx, qMsg); err != nil {
			if nakErr := msg.Nak(); nakErr != nil {
				log.Printf("nats: failed to nak message on %s: %v", subject, nakErr)
			}
			return
		}
		if ackErr := msg.Ack(); ackErr != nil {
			log.Printf("nats: failed to ack message on %s: %v", subject, ackErr)
		}
	})
	if err != nil {
		return fmt.Errorf("consume %s: %w", subject, err)
	}

	s.contexts = append(s.contexts, cc)
	return nil
}

func (s *Subscriber) Close() error {
	for _, cc := range s.contexts {
		cc.Stop()
	}
	s.nc.Close()
	return nil
}

func consumerName(subject string) string {
	// "anchor.vehicle" → "anchor-vehicle"
	name := ""
	for _, c := range subject {
		if c == '.' {
			name += "-"
		} else {
			name += string(c)
		}
	}
	return name
}
