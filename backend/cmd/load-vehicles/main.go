package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// JSON structures matching vehicles.json
type VehicleJSON struct {
	Plate  string      `json:"plate"`
	Events []EventJSON `json:"events"`
	Info   VehicleInfo `json:"info"`
}

type EventJSON struct {
	Year   string   `json:"year"`
	Name   string   `json:"name"`
	Date   *string  `json:"date"`
	Photos []string `json:"photos"`
}

type VehicleInfo struct {
	Plate     string `json:"plate"`
	VIN       string `json:"vin"`
	Make      string `json:"make"`
	Model     string `json:"model"`
	PlateDate string `json:"plateDate"`
	CubicCap  string `json:"cubicCap"`
	FuelType  string `json:"fuelType"`
	PowerCV   string `json:"powercv"`
}

// API request/response types
type CreateCertifierVehicleReq struct {
	Make          string `json:"make"`
	Model         string `json:"model"`
	Year          int    `json:"year"`
	LicensePlate  string `json:"licensePlate,omitempty"`
	ChassisNumber string `json:"chassisNumber,omitempty"`
	Fuel          string `json:"fuel,omitempty"`
	EngineCc      int    `json:"engineCc,omitempty"`
	EnginePowerHp int    `json:"enginePowerHp,omitempty"`
}

type VehicleResp struct {
	ID string `json:"id"`
}

type CreateEventReq struct {
	VehicleID      string `json:"vehicleId"`
	EntityID       string `json:"entityId"`
	Type           string `json:"type"`
	Title          string `json:"title"`
	Date           string `json:"date"`
	ImageSessionID string `json:"imageSessionId,omitempty"`
}

type UploadSessionResp struct {
	SessionID string `json:"sessionId"`
}

type UploadURLReq struct {
	Filename string `json:"filename"`
}

type UploadURLResp struct {
	ImageID   string `json:"imageId"`
	UploadURL string `json:"uploadUrl"`
}

func main() {
	baseURL := flag.String("base-url", "http://localhost:8080", "API base URL")
	entityID := flag.String("entity-id", "", "Entity UUID (required)")
	token := flag.String("token", "", "OAuth2 bearer token (required)")
	jsonPath := flag.String("json", "", "Path to vehicles.json (required)")
	dryRun := flag.Bool("dry-run", false, "Print actions without executing")
	flag.Parse()

	if *entityID == "" || *token == "" || *jsonPath == "" {
		flag.Usage()
		os.Exit(1)
	}

	data, err := os.ReadFile(*jsonPath)
	if err != nil {
		log.Fatalf("Failed to read JSON: %v", err)
	}

	var vehicles []VehicleJSON
	if err := json.Unmarshal(data, &vehicles); err != nil {
		log.Fatalf("Failed to parse JSON: %v", err)
	}

	client := &http.Client{Timeout: 60 * time.Second}
	loader := &Loader{
		baseURL:  strings.TrimRight(*baseURL, "/"),
		entityID: *entityID,
		token:    *token,
		client:   client,
		dryRun:   *dryRun,
	}

	log.Printf("Loading %d vehicles (dry-run=%v)", len(vehicles), *dryRun)

	for i, v := range vehicles {
		if err := loader.loadVehicle(i+1, v); err != nil {
			log.Printf("ERROR vehicle %s: %v", v.Plate, err)
		}
	}

	log.Println("Done.")
}

type Loader struct {
	baseURL  string
	entityID string
	token    string
	client   *http.Client
	dryRun   bool
}

func (l *Loader) loadVehicle(idx int, v VehicleJSON) error {
	make_ := titleCase(v.Info.Make)
	model := v.Info.Model
	year := extractYear(v.Info.PlateDate)

	vehicleReq := CreateCertifierVehicleReq{
		Make:          make_,
		Model:         model,
		Year:          year,
		LicensePlate:  v.Plate,
		ChassisNumber: v.Info.VIN,
		Fuel:          mapFuelType(v.Info.FuelType),
		EngineCc:      parseIntOrZero(v.Info.CubicCap),
		EnginePowerHp: parseIntOrZero(v.Info.PowerCV),
	}

	log.Printf("[%d] Vehicle: %s %s %s (%d)", idx, v.Plate, make_, model, year)

	if l.dryRun {
		printJSON("  POST /certifiers/vehicles", vehicleReq)
		for _, ev := range v.Events {
			evType := classifyEvent(ev.Name)
			eventReq := CreateEventReq{
				VehicleID: "<vehicleId>",
				EntityID:  l.entityID,
				Type:      evType,
				Title:     ev.Name,
				Date:      resolveDate(ev.Date, ev.Year),
			}
			if len(ev.Photos) > 0 {
				eventReq.ImageSessionID = "<sessionId>"
			}
			printJSON(fmt.Sprintf("  POST /events [%d photos]", len(ev.Photos)), eventReq)
		}
		return nil
	}

	vehicleID, err := l.createVehicle(vehicleReq)
	if err != nil {
		return fmt.Errorf("create vehicle: %w", err)
	}
	log.Printf("  Created vehicle: %s", vehicleID)

	for j, ev := range v.Events {
		if err := l.loadEvent(j+1, vehicleID, ev); err != nil {
			log.Printf("  ERROR event %q: %v", ev.Name, err)
		}
	}

	return nil
}

func (l *Loader) loadEvent(idx int, vehicleID string, ev EventJSON) error {
	evType := classifyEvent(ev.Name)
	date := resolveDate(ev.Date, ev.Year)

	log.Printf("  [%d] Event: %s [%s] %s (%d photos)", idx, ev.Name, evType, date, len(ev.Photos))

	photos := ev.Photos
	if len(photos) > 10 {
		log.Printf("    Capping photos from %d to 10 (session limit)", len(photos))
		photos = photos[:10]
	}

	var sessionID string
	if len(photos) > 0 {
		sid, err := l.createUploadSession()
		if err != nil {
			return fmt.Errorf("create upload session: %w", err)
		}
		sessionID = sid

		for _, photoPath := range photos {
			if err := l.uploadPhoto(sessionID, photoPath); err != nil {
				log.Printf("    WARN photo %s: %v", filepath.Base(photoPath), err)
			}
		}
	}

	req := CreateEventReq{
		VehicleID:      vehicleID,
		EntityID:       l.entityID,
		Type:           evType,
		Title:          ev.Name,
		Date:           date,
		ImageSessionID: sessionID,
	}

	eventID, err := l.createEvent(req)
	if err != nil {
		return fmt.Errorf("create event: %w", err)
	}
	log.Printf("    Created event: %s", eventID)
	return nil
}

func (l *Loader) uploadPhoto(sessionID, photoPath string) error {
	filename := filepath.Base(photoPath)

	// Get upload URL
	body, _ := json.Marshal(UploadURLReq{Filename: filename})
	resp, err := l.doRequest("POST", fmt.Sprintf("/event-images/%s/upload-url", sessionID), body)
	if err != nil {
		return fmt.Errorf("get upload URL: %w", err)
	}

	var uploadResp UploadURLResp
	if err := json.Unmarshal(resp, &uploadResp); err != nil {
		return fmt.Errorf("parse upload URL response: %w", err)
	}

	// Upload file to pre-signed URL
	fileData, err := os.ReadFile(photoPath)
	if err != nil {
		return fmt.Errorf("read file %s: %w", photoPath, err)
	}

	putReq, err := http.NewRequest("PUT", uploadResp.UploadURL, bytes.NewReader(fileData))
	if err != nil {
		return err
	}
	putReq.Header.Set("Content-Type", "application/octet-stream")

	putResp, err := l.client.Do(putReq)
	if err != nil {
		return fmt.Errorf("upload to S3: %w", err)
	}
	putResp.Body.Close()
	if putResp.StatusCode >= 300 {
		return fmt.Errorf("S3 upload returned %d", putResp.StatusCode)
	}

	// Confirm upload
	_, err = l.doRequest("POST", fmt.Sprintf("/event-images/%s/confirm", uploadResp.ImageID), nil)
	if err != nil {
		return fmt.Errorf("confirm upload: %w", err)
	}

	log.Printf("    Uploaded: %s", filename)
	return nil
}

func (l *Loader) createVehicle(req CreateCertifierVehicleReq) (string, error) {
	body, _ := json.Marshal(req)
	resp, err := l.doRequest("POST", "/certifiers/vehicles", body)
	if err != nil {
		return "", err
	}
	var v VehicleResp
	if err := json.Unmarshal(resp, &v); err != nil {
		return "", err
	}
	return v.ID, nil
}

func (l *Loader) createEvent(req CreateEventReq) (string, error) {
	body, _ := json.Marshal(req)
	resp, err := l.doRequest("POST", "/events", body)
	if err != nil {
		return "", err
	}
	var result struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(resp, &result); err != nil {
		return "", err
	}
	return result.ID, nil
}

func (l *Loader) createUploadSession() (string, error) {
	resp, err := l.doRequest("POST", "/event-images/upload-session", nil)
	if err != nil {
		return "", err
	}
	var session UploadSessionResp
	if err := json.Unmarshal(resp, &session); err != nil {
		return "", err
	}
	return session.SessionID, nil
}

func (l *Loader) doRequest(method, path string, body []byte) ([]byte, error) {
	var bodyReader io.Reader
	if body != nil {
		bodyReader = bytes.NewReader(body)
	}

	req, err := http.NewRequest(method, l.baseURL+path, bodyReader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+l.token)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := l.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("%s %s returned %d: %s", method, path, resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

func classifyEvent(name string) string {
	if strings.Contains(strings.ToLower(name), "rally") {
		return "rally"
	}
	return "road_trip"
}

func resolveDate(date *string, year string) string {
	d := year + "-07-01"
	if date != nil && *date != "" {
		d = *date
	}
	return d + "T00:00:00Z"
}

func printJSON(label string, v any) {
	b, _ := json.MarshalIndent(v, "    ", "  ")
	log.Printf("%s\n    %s", label, string(b))
}

func extractYear(plateDate string) int {
	// plateDate format: MM/YYYY
	parts := strings.Split(plateDate, "/")
	if len(parts) == 2 {
		var y int
		fmt.Sscanf(parts[1], "%d", &y)
		if y > 0 {
			return y
		}
	}
	return 0
}

func titleCase(s string) string {
	words := strings.Fields(strings.ToLower(s))
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

func mapFuelType(fuelType string) string {
	switch strings.ToUpper(fuelType) {
	case "GASOLINA":
		return "petrol"
	case "GASÓLEO", "GASOLEO", "DIESEL":
		return "diesel"
	case "GPL", "LPG":
		return "lpg"
	case "ELÉTRICO", "ELETRICO", "ELECTRIC":
		return "electric"
	case "HÍBRIDO", "HIBRIDO", "HYBRID":
		return "hybrid"
	case "HIDROGÉNIO", "HIDROGENIO", "HYDROGEN":
		return "hydrogen"
	default:
		return ""
	}
}

func parseIntOrZero(s string) int {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0
	}
	var n int
	fmt.Sscanf(s, "%d", &n)
	return n
}
