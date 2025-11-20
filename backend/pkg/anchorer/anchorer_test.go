package anchorer

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateCID_SimpleString(t *testing.T) {
	data := "hello"
	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
	assert.True(t, len(cid.CID) > 0)
}

func TestGenerateCID_SimpleObject(t *testing.T) {
	data := map[string]interface{}{
		"name": "test",
		"age":  30,
	}
	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
	assert.True(t, len(cid.CID) > 0)
}

func TestGenerateCID_VehicleRecord(t *testing.T) {
	vehicleID := uuid.New()
	record := VehicleRecord{
		ID:    vehicleID,
		Make:  ptr("Toyota"),
		Model: ptr("Supra"),
		Year:  ptr(1995),
	}

	cid, err := GenerateCID(record)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
	assert.True(t, len(cid.CID) > 0)
}

func TestGenerateCID_Deterministic(t *testing.T) {
	now := time.Now()
	vehicleID := uuid.New()

	record := VehicleRecord{
		ID:            vehicleID,
		LicensePlate:  ptr("XYZ789"),
		ChassisNumber: ptr("VIN123456"),
		Make:          ptr("Honda"),
		Model:         ptr("Civic"),
		Year:          ptr(2010),
		Color:         ptr("Blue"),
		CreatedAt:     now,
	}

	cid1, err := GenerateCID(record)
	require.NoError(t, err)

	cid2, err := GenerateCID(record)
	require.NoError(t, err)

	assert.Equal(t, cid1, cid2, "same data should produce same CID")
}

func TestGenerateCID_DifferentData(t *testing.T) {
	now := time.Now()

	record1 := VehicleRecord{
		ID:        uuid.New(),
		Make:      ptr("Toyota"),
		Model:     ptr("Corolla"),
		Year:      ptr(2015),
		CreatedAt: now,
	}

	record2 := VehicleRecord{
		ID:        uuid.New(),
		Make:      ptr("Honda"),
		Model:     ptr("Accord"),
		Year:      ptr(2018),
		CreatedAt: now,
	}

	cid1, err := GenerateCID(record1)
	require.NoError(t, err)

	cid2, err := GenerateCID(record2)
	require.NoError(t, err)

	assert.NotEqual(t, cid1, cid2, "different data should produce different CIDs")
}

func TestGenerateCID_SimpleDeterminism(t *testing.T) {
	// Test that field order doesn't matter - CBOR encoding should be deterministic
	now := time.Now()
	vehicleID := uuid.New()

	// Create two records with same data but fields set in different order
	record1 := VehicleRecord{
		ID:        vehicleID,
		Make:      ptr("Mazda"),
		Model:     ptr("MX-5"),
		Year:      ptr(1999),
		CreatedAt: now,
	}

	record2 := VehicleRecord{
		CreatedAt: now,
		Year:      ptr(1999),
		Model:     ptr("MX-5"),
		Make:      ptr("Mazda"),
		ID:        vehicleID,
	}

	cid1, err := GenerateCID(record1)
	require.NoError(t, err)

	cid2, err := GenerateCID(record2)
	require.NoError(t, err)

	assert.Equal(t, cid1, cid2, "field initialization order should not affect CID")
}

func TestGenerateCID_NestedStructures(t *testing.T) {
	now := time.Now()

	record := VehicleRecord{
		ID:        uuid.New(),
		Make:      ptr("Porsche"),
		Model:     ptr("911"),
		Year:      ptr(1985),
		CreatedAt: now,
	}

	cid, err := GenerateCID(record)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_EmptyObject(t *testing.T) {
	record := VehicleRecord{
		ID:        uuid.New(),
		CreatedAt: time.Now(),
	}

	cid, err := GenerateCID(record)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_EmptyArray(t *testing.T) {
	data := []interface{}{}

	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_NilValue(t *testing.T) {
	data := map[string]interface{}{"value": nil}

	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_ArrayOfObjects(t *testing.T) {
	data := []map[string]interface{}{
		{"id": 1, "name": "first"},
		{"id": 2, "name": "second"},
	}

	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_WithTimestamp(t *testing.T) {
	now := time.Now()
	data := map[string]interface{}{
		"timestamp": now,
		"name":      "test",
	}

	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_WithUUID(t *testing.T) {
	id := uuid.New()
	data := map[string]interface{}{
		"id": id,
	}

	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_ComplexVehicleRecord(t *testing.T) {
	vehicleID := uuid.New()
	ownerID := uuid.New()
	now := time.Now()

	record := VehicleRecord{
		ID:                 vehicleID,
		LicensePlate:       ptr("ABC123"),
		ChassisNumber:      ptr("12345ABCD"),
		Make:               ptr("Ferrari"),
		Model:              ptr("F40"),
		Year:               ptr(1987),
		Color:              ptr("Red"),
		EngineNumber:       ptr("F40ENG001"),
		TransmissionNumber: ptr("F40TRN001"),
		BodyType:           ptr("Sports"),
		DriveType:          ptr("RWD"),
		GearType:           ptr("Manual"),
		SuspensionType:     ptr("Double Wishbone"),
		OwnerID:            &ownerID,
		CreatedAt:          now,
	}

	cid, err := GenerateCID(record)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_SpecialCharacters(t *testing.T) {
	data := map[string]interface{}{
		"special": "!@#$%^&*()",
		"unicode": "你好世界🌍",
		"newline": "line1\nline2",
	}

	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_LargeNumbers(t *testing.T) {
	data := map[string]interface{}{
		"large_int":   9223372036854775807, // max int64
		"large_float": 1.7976931348623157e+308,
	}

	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_Boolean(t *testing.T) {
	data := map[string]interface{}{
		"true_val":  true,
		"false_val": false,
	}

	cid, err := GenerateCID(data)

	require.NoError(t, err)
	assert.NotEmpty(t, cid)
}

func TestGenerateCID_FormatsAsValidCIDv1(t *testing.T) {
	data := map[string]interface{}{"test": "data"}

	cid, err := GenerateCID(data)

	require.NoError(t, err)
	// CIDv1 format typically starts with 'b' for base32 encoding
	assert.True(t, len(cid.CID) > 0, "CID should not be empty")
	// CIDv1 base32 encoded CIDs start with 'b'
	assert.Equal(t, "b", string(cid.CID[0]), "CIDv1 should start with 'b' (base32)")
}

func TestGenerateCID_UnmarshalableType(t *testing.T) {
	// chan types cannot be marshalled to JSON
	data := make(chan int)

	_, err := GenerateCID(data)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to marshal to JSON")
}

func TestGenerateCID_StructWithJSONTags(t *testing.T) {
	type CustomStruct struct {
		Name    string `json:"name"`
		Age     int    `json:"age"`
		Ignored string `json:"-"`
	}

	data := CustomStruct{
		Name:    "John",
		Age:     30,
		Ignored: "should not be in CID",
	}

	cid1, err := GenerateCID(data)
	require.NoError(t, err)

	data2 := CustomStruct{
		Name:    "John",
		Age:     30,
		Ignored: "different value but should not matter",
	}

	cid2, err := GenerateCID(data2)
	require.NoError(t, err)

	assert.Equal(t, cid1, cid2, "ignored fields should not affect CID")
}

func TestGenerateCID_FloatPrecision(t *testing.T) {
	// Test that floating point representation is consistent
	data := map[string]interface{}{
		"pi": 3.14159265359,
	}

	cid1, err := GenerateCID(data)
	require.NoError(t, err)

	cid2, err := GenerateCID(data)
	require.NoError(t, err)

	assert.Equal(t, cid1, cid2, "float precision should be consistent")
}

func TestGenerateCID_WhitespaceVariations(t *testing.T) {
	dataStr1 := `{"name":"test","value":123}`
	dataStr2 := `{ "name" : "test" , "value" : 123 }`

	var data1, data2 interface{}
	require.NoError(t, json.Unmarshal([]byte(dataStr1), &data1))
	require.NoError(t, json.Unmarshal([]byte(dataStr2), &data2))

	cid1, err := GenerateCID(data1)
	require.NoError(t, err)

	cid2, err := GenerateCID(data2)
	require.NoError(t, err)

	assert.Equal(t, cid1, cid2, "whitespace should not affect CID")
}

func TestGenerateCID_Reproducibility(t *testing.T) {
	// This test ensures that the CID is reproducible across different systems
	// (JSON marshaling with consistent ordering)
	record := VehicleRecord{
		ID:    uuid.New(),
		Make:  ptr("BMW"),
		Model: ptr("M5"),
		Year:  ptr(2010),
	}

	cids := make([]string, 10)
	for i := 0; i < 10; i++ {
		cid, err := GenerateCID(record)
		require.NoError(t, err)
		cids[i] = cid.CID
	}

	for i := 1; i < 10; i++ {
		assert.Equal(t, cids[0], cids[i], "CID should be reproducible across multiple calls")
	}
}
