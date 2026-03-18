package event

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/ClassicCarsRestore/ClassicsChain/internal/vehicles"
	cidpkg "github.com/ClassicCarsRestore/ClassicsChain/pkg/cid"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- Mocks ---

type mockRepo struct {
	getByIDFunc func(ctx context.Context, id uuid.UUID) (*Event, error)
	createFunc  func(ctx context.Context, event Event) (*Event, error)
	updateFunc  func(ctx context.Context, event Event) error
}

func (m *mockRepo) GetByVehicle(ctx context.Context, vehicleID uuid.UUID, limit, offset int) ([]Event, int, error) {
	return nil, 0, nil
}
func (m *mockRepo) GetByID(ctx context.Context, id uuid.UUID) (*Event, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(ctx, id)
	}
	return nil, ErrEventNotFound
}
func (m *mockRepo) Create(ctx context.Context, event Event) (*Event, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, event)
	}
	event.ID = uuid.New()
	return &event, nil
}
func (m *mockRepo) Update(ctx context.Context, event Event) error {
	if m.updateFunc != nil {
		return m.updateFunc(ctx, event)
	}
	return nil
}
func (m *mockRepo) Delete(ctx context.Context, id uuid.UUID) error { return nil }

type mockPublisher struct {
	publishFunc func(ctx context.Context, subject string, data []byte) error
	published   [][]byte
}

func (m *mockPublisher) Publish(ctx context.Context, subject string, data []byte) error {
	m.published = append(m.published, data)
	if m.publishFunc != nil {
		return m.publishFunc(ctx, subject, data)
	}
	return nil
}
func (m *mockPublisher) Close() error { return nil }

type mockCIDGen struct{}

func (m *mockCIDGen) GenerateCID(data interface{}) (*cidpkg.CID, error) {
	return &cidpkg.CID{CID: "mock-cid", SourceJSON: "{}", SourceCBOR: "AA=="}, nil
}

type mockImageService struct {
	validateFunc func(ctx context.Context, sessionID uuid.UUID) ([]string, error)
	attachFunc   func(ctx context.Context, sessionID, eventID uuid.UUID) error
}

func (m *mockImageService) ValidateSessionForEvent(ctx context.Context, sessionID uuid.UUID) ([]string, error) {
	if m.validateFunc != nil {
		return m.validateFunc(ctx, sessionID)
	}
	return nil, nil
}
func (m *mockImageService) AttachToEvent(ctx context.Context, sessionID, eventID uuid.UUID) error {
	if m.attachFunc != nil {
		return m.attachFunc(ctx, sessionID, eventID)
	}
	return nil
}

// --- Tests ---

func ptr[T any](v T) *T { return &v }

func TestService_Create_WithoutImages(t *testing.T) {
	eventID := uuid.New()
	repo := &mockRepo{
		createFunc: func(_ context.Context, e Event) (*Event, error) {
			e.ID = eventID
			return &e, nil
		},
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*Event, error) {
			return &Event{ID: id, Title: "Car Show", Type: TypeCarShow}, nil
		},
	}
	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})

	vehicle := vehicles.Vehicle{ID: uuid.New(), Make: "Porsche", Model: "911"}
	result, err := svc.Create(context.Background(), vehicle, CreateEventParams{
		VehicleID: vehicle.ID,
		Type:      TypeCarShow,
		Title:     "Car Show",
	})

	require.NoError(t, err)
	assert.Equal(t, "Car Show", result.Title)
}

func TestService_Create_DateDefaultsToNow(t *testing.T) {
	before := time.Now().UTC()

	var createdEvent Event
	repo := &mockRepo{
		createFunc: func(_ context.Context, e Event) (*Event, error) {
			createdEvent = e
			e.ID = uuid.New()
			return &e, nil
		},
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*Event, error) {
			return &createdEvent, nil
		},
	}
	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})

	_, err := svc.Create(context.Background(), vehicles.Vehicle{}, CreateEventParams{
		Title: "Test",
		Type:  TypeMaintenance,
		Date:  nil,
	})

	require.NoError(t, err)
	assert.True(t, createdEvent.Date.After(before) || createdEvent.Date.Equal(before))
}

func TestService_Create_WithExplicitDate(t *testing.T) {
	customDate := time.Date(2020, 6, 15, 0, 0, 0, 0, time.UTC)

	var createdEvent Event
	repo := &mockRepo{
		createFunc: func(_ context.Context, e Event) (*Event, error) {
			createdEvent = e
			e.ID = uuid.New()
			return &e, nil
		},
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Event, error) {
			return &createdEvent, nil
		},
	}
	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})

	_, err := svc.Create(context.Background(), vehicles.Vehicle{}, CreateEventParams{
		Title: "Test",
		Type:  TypeRestoration,
		Date:  &customDate,
	})

	require.NoError(t, err)
	assert.Equal(t, customDate, createdEvent.Date)
}

func TestService_Create_WithImagesAndAnchoring(t *testing.T) {
	attachCalled := false
	pub := &mockPublisher{}

	repo := &mockRepo{
		createFunc: func(_ context.Context, e Event) (*Event, error) {
			e.ID = uuid.New()
			return &e, nil
		},
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*Event, error) {
			return &Event{ID: id}, nil
		},
	}
	imgSvc := &mockImageService{
		validateFunc: func(_ context.Context, _ uuid.UUID) ([]string, error) {
			return []string{"cid1", "cid2"}, nil
		},
		attachFunc: func(_ context.Context, _, _ uuid.UUID) error {
			attachCalled = true
			return nil
		},
	}

	svc := NewService(repo, pub, &mockCIDGen{})
	svc.SetEventImageService(imgSvc)

	sessionID := uuid.New()
	result, err := svc.Create(context.Background(), vehicles.Vehicle{}, CreateEventParams{
		Title:          "With Images",
		Type:           TypeCertification,
		ShouldAnchor:   true,
		ImageSessionID: &sessionID,
	})

	require.NoError(t, err)
	assert.True(t, attachCalled)
	assert.Len(t, pub.published, 1)
	assert.NotNil(t, result)
}

func TestService_Create_ImageValidationError(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockPublisher{}, &mockCIDGen{})
	svc.SetEventImageService(&mockImageService{
		validateFunc: func(_ context.Context, _ uuid.UUID) ([]string, error) {
			return nil, errors.New("unconfirmed images")
		},
	})

	sessionID := uuid.New()
	_, err := svc.Create(context.Background(), vehicles.Vehicle{}, CreateEventParams{
		Title:          "Fail",
		Type:           TypeMaintenance,
		ImageSessionID: &sessionID,
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "validate image session")
}

func TestService_Update_PartialFields(t *testing.T) {
	original := &Event{
		ID:       uuid.New(),
		Title:    "Original",
		Location: ptr("Lisbon"),
		Date:     time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
	}

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Event, error) {
			copy := *original
			return &copy, nil
		},
	}
	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})

	newDate := time.Date(2025, 6, 15, 0, 0, 0, 0, time.UTC)
	result, err := svc.Update(context.Background(), original.ID, UpdateEventParams{
		Title:     ptr("Updated Title"),
		EventDate: &newDate,
	})

	require.NoError(t, err)
	assert.Equal(t, "Updated Title", result.Title)
	assert.Equal(t, newDate, result.Date)
	assert.Equal(t, ptr("Lisbon"), result.Location) // unchanged
}

func TestService_Update_NotFound(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockPublisher{}, &mockCIDGen{})

	_, err := svc.Update(context.Background(), uuid.New(), UpdateEventParams{})
	assert.ErrorIs(t, err, ErrEventNotFound)
}

func TestService_Update_AllFields(t *testing.T) {
	original := &Event{
		ID:    uuid.New(),
		Title: "Original",
	}

	var updated Event
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Event, error) {
			copy := *original
			return &copy, nil
		},
		updateFunc: func(_ context.Context, e Event) error {
			updated = e
			return nil
		},
	}
	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})

	meta := map[string]interface{}{"key": "value"}
	newDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	result, err := svc.Update(context.Background(), original.ID, UpdateEventParams{
		Title:       ptr("New Title"),
		Description: ptr("A description"),
		EventDate:   &newDate,
		Location:    ptr("Porto"),
		Metadata:    meta,
	})

	require.NoError(t, err)
	assert.Equal(t, "New Title", result.Title)
	assert.Equal(t, ptr("A description"), result.Description)
	assert.Equal(t, newDate, result.Date)
	assert.Equal(t, ptr("Porto"), result.Location)
	assert.Equal(t, meta, updated.Metadata)
}

func TestService_Update_RepoError(t *testing.T) {
	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Event, error) {
			return &Event{ID: uuid.New()}, nil
		},
		updateFunc: func(_ context.Context, _ Event) error {
			return errors.New("db error")
		},
	}
	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})

	_, err := svc.Update(context.Background(), uuid.New(), UpdateEventParams{Title: ptr("X")})
	assert.Error(t, err)
}

func TestService_GetByVehicle(t *testing.T) {
	vehicleID := uuid.New()
	expected := []Event{{ID: uuid.New(), VehicleID: vehicleID}}

	repo := &mockRepo{}
	// Override the default by using a full mock repo with GetByVehicle
	svc := NewService(&getByVehicleRepo{events: expected, total: 1}, &mockPublisher{}, &mockCIDGen{})

	result, total, err := svc.GetByVehicle(context.Background(), vehicleID, 10, 0)
	require.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, 1, total)

	_ = repo // suppress unused
}

func TestService_GetByID(t *testing.T) {
	eventID := uuid.New()
	expected := &Event{ID: eventID, Title: "Test"}

	repo := &mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Event, error) {
			return expected, nil
		},
	}
	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})

	result, err := svc.GetByID(context.Background(), eventID)
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_Delete(t *testing.T) {
	var deletedID uuid.UUID
	repo := &deleteRepo{
		deleteFunc: func(_ context.Context, id uuid.UUID) error {
			deletedID = id
			return nil
		},
	}
	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})

	eventID := uuid.New()
	err := svc.Delete(context.Background(), eventID)
	require.NoError(t, err)
	assert.Equal(t, eventID, deletedID)
}

func TestService_Create_RepoError(t *testing.T) {
	repo := &mockRepo{
		createFunc: func(_ context.Context, _ Event) (*Event, error) {
			return nil, errors.New("db error")
		},
	}
	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})

	_, err := svc.Create(context.Background(), vehicles.Vehicle{}, CreateEventParams{
		Title: "Test", Type: TypeMaintenance,
	})
	assert.Error(t, err)
}

func TestService_Create_PublishError(t *testing.T) {
	repo := &mockRepo{
		createFunc: func(_ context.Context, e Event) (*Event, error) {
			e.ID = uuid.New()
			return &e, nil
		},
		getByIDFunc: func(_ context.Context, id uuid.UUID) (*Event, error) {
			return &Event{ID: id}, nil
		},
	}
	pub := &mockPublisher{
		publishFunc: func(_ context.Context, _ string, _ []byte) error {
			return errors.New("nats error")
		},
	}
	svc := NewService(repo, pub, &mockCIDGen{})

	_, err := svc.Create(context.Background(), vehicles.Vehicle{}, CreateEventParams{
		Title: "Test", Type: TypeCertification, ShouldAnchor: true,
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "nats error")
}

func TestService_Create_AttachError(t *testing.T) {
	repo := &mockRepo{
		createFunc: func(_ context.Context, e Event) (*Event, error) {
			e.ID = uuid.New()
			return &e, nil
		},
	}
	imgSvc := &mockImageService{
		validateFunc: func(_ context.Context, _ uuid.UUID) ([]string, error) {
			return []string{"cid1"}, nil
		},
		attachFunc: func(_ context.Context, _, _ uuid.UUID) error {
			return errors.New("attach error")
		},
	}

	svc := NewService(repo, &mockPublisher{}, &mockCIDGen{})
	svc.SetEventImageService(imgSvc)

	sessionID := uuid.New()
	_, err := svc.Create(context.Background(), vehicles.Vehicle{}, CreateEventParams{
		Title: "Test", Type: TypeMaintenance, ImageSessionID: &sessionID,
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "attach images")
}

// --- Helper repo types for delegation tests ---

type getByVehicleRepo struct {
	mockRepo
	events []Event
	total  int
}

func (r *getByVehicleRepo) GetByVehicle(_ context.Context, _ uuid.UUID, _, _ int) ([]Event, int, error) {
	return r.events, r.total, nil
}

type deleteRepo struct {
	mockRepo
	deleteFunc func(ctx context.Context, id uuid.UUID) error
}

func (r *deleteRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if r.deleteFunc != nil {
		return r.deleteFunc(ctx, id)
	}
	return nil
}
