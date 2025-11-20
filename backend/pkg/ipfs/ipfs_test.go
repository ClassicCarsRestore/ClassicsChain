package ipfs

import (
	"context"
	"testing"
)

// TestNew verifies client creation
func TestNew(t *testing.T) {
	client := New("http://localhost:5001")
	if client == nil {
		t.Fatal("expected client to be non-nil")
	}
	if client.rpc == nil {
		t.Error("expected rpc to be non-nil")
	}
}

// TestAddAndGetJSON tests adding and retrieving JSON documents
func TestAddAndGetJSON(t *testing.T) {
	// Skip if IPFS is not running
	client := New("http://localhost:5001")
	ctx := context.Background()

	if !client.IsOnline(ctx) {
		t.Skip("IPFS node is not running, skipping test")
	}

	// Test data
	testData := map[string]interface{}{
		"vehicle": "Ferrari 250 GTO",
		"year":    1962,
		"owner":   "test-owner-id",
	}

	// Add JSON to IPFS
	cid, err := client.AddJSON(ctx, testData)
	if err != nil {
		t.Fatalf("failed to add JSON: %v", err)
	}

	if cid == "" {
		t.Fatal("expected non-empty CID")
	}

	t.Logf("Added document with CID: %s", cid)

	// Retrieve and verify
	var retrieved map[string]interface{}
	if err := client.GetJSON(ctx, cid, &retrieved); err != nil {
		t.Fatalf("failed to get JSON: %v", err)
	}

	if retrieved["vehicle"] != testData["vehicle"] {
		t.Errorf("expected vehicle %v, got %v", testData["vehicle"], retrieved["vehicle"])
	}

	// Note: JSON numbers are unmarshaled as float64
	if int(retrieved["year"].(float64)) != testData["year"] {
		t.Errorf("expected year %v, got %v", testData["year"], retrieved["year"])
	}
}

// TestAddAndGetBytes tests adding and retrieving raw bytes
func TestAddAndGetBytes(t *testing.T) {
	client := New("http://localhost:5001")
	ctx := context.Background()

	if !client.IsOnline(ctx) {
		t.Skip("IPFS node is not running, skipping test")
	}

	testData := []byte("Hello, IPFS!")

	cid, err := client.AddBytes(ctx, testData)
	if err != nil {
		t.Fatalf("failed to add bytes: %v", err)
	}

	if cid == "" {
		t.Fatal("expected non-empty CID")
	}

	retrieved, err := client.Get(ctx, cid)
	if err != nil {
		t.Fatalf("failed to get bytes: %v", err)
	}

	if string(retrieved) != string(testData) {
		t.Errorf("expected %s, got %s", testData, retrieved)
	}
}

// TestPin tests pinning functionality
func TestPin(t *testing.T) {
	client := New("http://localhost:5001")
	ctx := context.Background()

	if !client.IsOnline(ctx) {
		t.Skip("IPFS node is not running, skipping test")
	}

	// Add some data first
	testData := []byte("pinned content")
	cid, err := client.AddBytes(ctx, testData)
	if err != nil {
		t.Fatalf("failed to add bytes: %v", err)
	}

	// Pin it
	if err := client.Pin(ctx, cid); err != nil {
		t.Errorf("failed to pin: %v", err)
	}

	// Unpin it
	if err := client.Unpin(ctx, cid); err != nil {
		t.Errorf("failed to unpin: %v", err)
	}
}

// TestIsOnline tests connectivity check
func TestIsOnline(t *testing.T) {
	client := New("http://localhost:5001")
	ctx := context.Background()

	online := client.IsOnline(ctx)
	if !online {
		t.Skip("IPFS node is not running")
	}

	t.Log("IPFS node is online")
}

// TestInvalidCID tests error handling for invalid CID
func TestInvalidCID(t *testing.T) {
	client := New("http://localhost:5001")
	ctx := context.Background()

	if !client.IsOnline(ctx) {
		t.Skip("IPFS node is not running, skipping test")
	}

	_, err := client.Get(ctx, "invalid-cid")
	if err == nil {
		t.Error("expected error for invalid CID")
	}
}
