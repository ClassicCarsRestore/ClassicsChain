package vehicles

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- Mocks ---

type mockRepo struct {
	getByIDFunc           func(ctx context.Context, id uuid.UUID) (*Vehicle, error)
	getByChassisNumberFunc func(ctx context.Context, chassisNumber string) (*Vehicle, error)
	getByLicensePlateFunc func(ctx context.Context, licensePlate string) (*Vehicle, error)
	createFunc            func(ctx context.Context, vehicle *Vehicle) (*Vehicle, error)
	updateFunc            func(ctx context.Context, vehicle *Vehicle) error
}

func (m *mockRepo) GetAll(ctx context.Context, limit, offset int, ownerID *uuid.UUID) ([]Vehicle, int, error) {
	return nil, 0, nil
}
func (m *mockRepo) GetAllWithStats(ctx context.Context, limit, offset int, ownerID *uuid.UUID) ([]VehicleWithStats, int, error) {
	return nil, 0, nil
}
func (m *mockRepo) GetByID(ctx context.Context, id uuid.UUID) (*Vehicle, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(ctx, id)
	}
	return nil, ErrVehicleNotFound
}
func (m *mockRepo) GetByOwnerID(ctx context.Context, ownerID uuid.UUID, limit, offset int) ([]Vehicle, int, error) {
	return nil, 0, nil
}
func (m *mockRepo) GetByChassisNumber(ctx context.Context, chassisNumber string) (*Vehicle, error) {
	if m.getByChassisNumberFunc != nil {
		return m.getByChassisNumberFunc(ctx, chassisNumber)
	}
	return nil, ErrVehicleNotFound
}
func (m *mockRepo) GetByLicensePlate(ctx context.Context, licensePlate string) (*Vehicle, error) {
	if m.getByLicensePlateFunc != nil {
		return m.getByLicensePlateFunc(ctx, licensePlate)
	}
	return nil, ErrVehicleNotFound
}
func (m *mockRepo) Create(ctx context.Context, vehicle *Vehicle) (*Vehicle, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, vehicle)
	}
	vehicle.ID = uuid.New()
	return vehicle, nil
}
func (m *mockRepo) Update(ctx context.Context, vehicle *Vehicle) error {
	if m.updateFunc != nil {
		return m.updateFunc(ctx, vehicle)
	}
	return nil
}
func (m *mockRepo) Delete(ctx context.Context, id uuid.UUID) error {
	return nil
}

type mockAnchorer struct {
	vehicleGenesisFunc func(ctx context.Context, vehicle Vehicle) (*string, error)
}

func (m *mockAnchorer) VehicleGenesis(ctx context.Context, vehicle Vehicle) (*string, error) {
	if m.vehicleGenesisFunc != nil {
		return m.vehicleGenesisFunc(ctx, vehicle)
	}
	txID := "mock-tx-id"
	return &txID, nil
}

// --- Tests ---

func ptr[T any](v T) *T { return &v }

func TestService_FindOrCreateVehicle_ChassisPriority(t *testing.T) {
	existing := &Vehicle{ID: uuid.New(), Make: "Porsche", Model: "911"}
	svc := NewService(&mockRepo{
		getByChassisNumberFunc: func(_ context.Context, _ string) (*Vehicle, error) {
			return existing, nil
		},
	}, &mockAnchorer{})

	chassis := "WBA12345"
	plate := "AA-00-BB"
	result, err := svc.FindOrCreateVehicle(context.Background(), &chassis, &plate)

	require.NoError(t, err)
	assert.Equal(t, existing.ID, result.ID)
}

func TestService_FindOrCreateVehicle_PlateFallback(t *testing.T) {
	existing := &Vehicle{ID: uuid.New(), Make: "Mercedes", Model: "W123"}
	svc := NewService(&mockRepo{
		getByChassisNumberFunc: func(_ context.Context, _ string) (*Vehicle, error) {
			return nil, ErrVehicleNotFound
		},
		getByLicensePlateFunc: func(_ context.Context, _ string) (*Vehicle, error) {
			return existing, nil
		},
	}, &mockAnchorer{})

	chassis := "NONEXIST"
	plate := "AA-00-BB"
	result, err := svc.FindOrCreateVehicle(context.Background(), &chassis, &plate)

	require.NoError(t, err)
	assert.Equal(t, existing.ID, result.ID)
}

func TestService_FindOrCreateVehicle_CreatesNew(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{})

	chassis := "NEW123"
	plate := "NEW-PLATE"
	result, err := svc.FindOrCreateVehicle(context.Background(), &chassis, &plate)

	require.NoError(t, err)
	assert.Equal(t, "Unknown", result.Make)
	assert.Equal(t, "Unknown", result.Model)
	assert.Nil(t, result.OwnerID)
	assert.Equal(t, &chassis, result.ChassisNumber)
}

func TestService_FindOrCreateVehicle_NilInputsCreatesNew(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{})

	result, err := svc.FindOrCreateVehicle(context.Background(), nil, nil)

	require.NoError(t, err)
	assert.Equal(t, "Unknown", result.Make)
}

func TestService_Create_WithoutAnchoring(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{})

	params := CreateVehicleParams{
		Make:  "BMW",
		Model: "2002",
		Year:  1972,
	}
	result, err := svc.Create(context.Background(), params)

	require.NoError(t, err)
	assert.Equal(t, "BMW", result.Make)
	assert.Equal(t, "2002", result.Model)
	assert.Equal(t, 1972, result.Year)
}

func TestService_Create_WithAnchoring(t *testing.T) {
	anchorerCalled := false
	svc := NewService(&mockRepo{}, &mockAnchorer{
		vehicleGenesisFunc: func(_ context.Context, _ Vehicle) (*string, error) {
			anchorerCalled = true
			txID := "tx-123"
			return &txID, nil
		},
	})

	params := CreateVehicleParams{
		Make:         "Alfa Romeo",
		Model:        "GTV",
		Year:         1974,
		ShouldAnchor: true,
	}
	_, err := svc.Create(context.Background(), params)

	require.NoError(t, err)
	assert.True(t, anchorerCalled)
}

func TestService_Create_AnchoringError(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{
		vehicleGenesisFunc: func(_ context.Context, _ Vehicle) (*string, error) {
			return nil, errors.New("blockchain error")
		},
	})

	params := CreateVehicleParams{ShouldAnchor: true, Make: "Fiat", Model: "500", Year: 1965}
	_, err := svc.Create(context.Background(), params)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "blockchain error")
}

func TestService_Update_PartialFields(t *testing.T) {
	original := &Vehicle{
		ID:    uuid.New(),
		Make:  "Porsche",
		Model: "911",
		Year:  1970,
		Color: ptr("Red"),
	}

	svc := NewService(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Vehicle, error) {
			copy := *original
			return &copy, nil
		},
	}, &mockAnchorer{})

	result, err := svc.Update(context.Background(), original.ID, UpdateVehicleParams{
		Color: ptr("Blue"),
		Year:  ptr(1971),
	})

	require.NoError(t, err)
	assert.Equal(t, ptr("Blue"), result.Color)
	assert.Equal(t, 1971, result.Year)
	assert.Equal(t, "Porsche", result.Make) // unchanged
}

func TestService_Update_NotFound(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{})

	_, err := svc.Update(context.Background(), uuid.New(), UpdateVehicleParams{})

	assert.ErrorIs(t, err, ErrVehicleNotFound)
}

func TestService_AssignOwnership_Success(t *testing.T) {
	vehicle := &Vehicle{ID: uuid.New(), OwnerID: nil}
	var updatedOwner *uuid.UUID

	svc := NewService(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Vehicle, error) {
			return vehicle, nil
		},
		updateFunc: func(_ context.Context, v *Vehicle) error {
			updatedOwner = v.OwnerID
			return nil
		},
	}, &mockAnchorer{})

	ownerID := uuid.New()
	err := svc.AssignOwnership(context.Background(), vehicle.ID, ownerID)

	require.NoError(t, err)
	assert.Equal(t, &ownerID, updatedOwner)
}

func TestService_AssignOwnership_NilVehicle(t *testing.T) {
	svc := NewService(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Vehicle, error) {
			return nil, nil
		},
	}, &mockAnchorer{})

	err := svc.AssignOwnership(context.Background(), uuid.New(), uuid.New())
	assert.NoError(t, err)
}

func TestService_AssignOwnership_GetError(t *testing.T) {
	svc := NewService(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Vehicle, error) {
			return nil, errors.New("db error")
		},
	}, &mockAnchorer{})

	err := svc.AssignOwnership(context.Background(), uuid.New(), uuid.New())
	assert.Error(t, err)
}

func TestService_GetAll(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{})

	result, total, err := svc.GetAll(context.Background(), 10, 0, nil)
	require.NoError(t, err)
	assert.Nil(t, result)
	assert.Equal(t, 0, total)
}

func TestService_GetAllWithStats(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{})

	result, total, err := svc.GetAllWithStats(context.Background(), 10, 0, nil)
	require.NoError(t, err)
	assert.Nil(t, result)
	assert.Equal(t, 0, total)
}

func TestService_GetByID(t *testing.T) {
	vehicleID := uuid.New()
	expected := &Vehicle{ID: vehicleID, Make: "BMW"}

	svc := NewService(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Vehicle, error) {
			return expected, nil
		},
	}, &mockAnchorer{})

	result, err := svc.GetByID(context.Background(), vehicleID)
	require.NoError(t, err)
	assert.Equal(t, expected, result)
}

func TestService_GetByOwnerID(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{})

	result, total, err := svc.GetByOwnerID(context.Background(), uuid.New(), 10, 0)
	require.NoError(t, err)
	assert.Nil(t, result)
	assert.Equal(t, 0, total)
}

func TestService_Delete(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{})

	err := svc.Delete(context.Background(), uuid.New())
	assert.NoError(t, err)
}

func TestService_Update_AllFields(t *testing.T) {
	original := &Vehicle{
		ID:    uuid.New(),
		Make:  "Porsche",
		Model: "911",
		Year:  1970,
	}

	var updated *Vehicle
	svc := NewService(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Vehicle, error) {
			copy := *original
			return &copy, nil
		},
		updateFunc: func(_ context.Context, v *Vehicle) error {
			updated = v
			return nil
		},
	}, &mockAnchorer{})

	result, err := svc.Update(context.Background(), original.ID, UpdateVehicleParams{
		LicensePlate:       ptr("AA-00-BB"),
		ChassisNumber:      ptr("WBA12345"),
		Make:               ptr("BMW"),
		Model:              ptr("2002"),
		Year:               ptr(1972),
		Color:              ptr("Blue"),
		EngineNumber:       ptr("ENG123"),
		TransmissionNumber: ptr("TR456"),
		BodyType:           ptr("Coupe"),
		DriveType:          ptr("RWD"),
		GearType:           ptr("Manual"),
		SuspensionType:     ptr("Independent"),
		Fuel:               ptr("Gasoline"),
		EngineCc:           ptr(2000),
		EngineCylinders:    ptr(4),
		EnginePowerHp:      ptr(130),
		OwnerID:            ptr(uuid.New()),
	})

	require.NoError(t, err)
	assert.Equal(t, "BMW", result.Make)
	assert.Equal(t, "2002", result.Model)
	assert.Equal(t, 1972, result.Year)
	assert.Equal(t, ptr("AA-00-BB"), result.LicensePlate)
	assert.Equal(t, ptr("WBA12345"), result.ChassisNumber)
	assert.Equal(t, ptr("Blue"), result.Color)
	assert.Equal(t, ptr("ENG123"), result.EngineNumber)
	assert.Equal(t, ptr("TR456"), result.TransmissionNumber)
	assert.Equal(t, ptr("Coupe"), result.BodyType)
	assert.Equal(t, ptr("RWD"), result.DriveType)
	assert.Equal(t, ptr("Manual"), result.GearType)
	assert.Equal(t, ptr("Independent"), result.SuspensionType)
	assert.Equal(t, ptr("Gasoline"), result.Fuel)
	assert.Equal(t, ptr(2000), result.EngineCc)
	assert.Equal(t, ptr(4), result.EngineCylinders)
	assert.Equal(t, ptr(130), result.EnginePowerHp)
	assert.NotNil(t, updated.OwnerID)
}

func TestService_Update_RepoError(t *testing.T) {
	svc := NewService(&mockRepo{
		getByIDFunc: func(_ context.Context, _ uuid.UUID) (*Vehicle, error) {
			return &Vehicle{ID: uuid.New()}, nil
		},
		updateFunc: func(_ context.Context, _ *Vehicle) error {
			return errors.New("db error")
		},
	}, &mockAnchorer{})

	_, err := svc.Update(context.Background(), uuid.New(), UpdateVehicleParams{Make: ptr("X")})
	assert.Error(t, err)
}

func TestService_Create_RepoError(t *testing.T) {
	svc := NewService(&mockRepo{
		createFunc: func(_ context.Context, _ *Vehicle) (*Vehicle, error) {
			return nil, errors.New("db error")
		},
	}, &mockAnchorer{})

	_, err := svc.Create(context.Background(), CreateVehicleParams{Make: "X", Model: "Y"})
	assert.Error(t, err)
}

func TestService_FindOrCreateVehicle_ChassisRepoError(t *testing.T) {
	svc := NewService(&mockRepo{
		getByChassisNumberFunc: func(_ context.Context, _ string) (*Vehicle, error) {
			return nil, errors.New("db error")
		},
	}, &mockAnchorer{})

	chassis := "WBA123"
	_, err := svc.FindOrCreateVehicle(context.Background(), &chassis, nil)
	assert.Error(t, err)
}

func TestService_FindOrCreateVehicle_PlateRepoError(t *testing.T) {
	svc := NewService(&mockRepo{
		getByLicensePlateFunc: func(_ context.Context, _ string) (*Vehicle, error) {
			return nil, errors.New("db error")
		},
	}, &mockAnchorer{})

	plate := "AA-00-BB"
	_, err := svc.FindOrCreateVehicle(context.Background(), nil, &plate)
	assert.Error(t, err)
}

func TestService_FindOrCreateVehicle_CreateError(t *testing.T) {
	svc := NewService(&mockRepo{
		createFunc: func(_ context.Context, _ *Vehicle) (*Vehicle, error) {
			return nil, errors.New("create error")
		},
	}, &mockAnchorer{})

	_, err := svc.FindOrCreateVehicle(context.Background(), nil, nil)
	assert.Error(t, err)
}

func TestService_FindOrCreateVehicle_EmptyStrings(t *testing.T) {
	svc := NewService(&mockRepo{}, &mockAnchorer{})

	empty := ""
	result, err := svc.FindOrCreateVehicle(context.Background(), &empty, &empty)
	require.NoError(t, err)
	assert.Equal(t, "Unknown", result.Make)
}
