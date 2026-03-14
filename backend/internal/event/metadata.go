package event

// CertificationMetadata contains vehicle certification-specific metadata
type CertificationMetadata struct {
	CertificateNumber         string   `json:"certificateNumber"`
	ConditionAssessment       string   `json:"conditionAssessment"`
	ValidityEndDate           *string  `json:"validityEndDate,omitempty"`
	DocumentationReferences   []string `json:"documentationReferences,omitempty"`
}

// CarShowMetadata contains car show & concours d'elegance event metadata
type CarShowMetadata struct {
	CertificateNumber string `json:"certificateNumber"`
	Category          string `json:"category"`
	Award             string `json:"award,omitempty"`
	JudgingScore      *int   `json:"judgingScore,omitempty"`
}

// ClassicMeetMetadata contains classic car meet/cruise-in event metadata
type ClassicMeetMetadata struct {
	CertificateNumber string `json:"certificateNumber"`
	ClubName          string `json:"clubName"`
	Theme             string `json:"theme,omitempty"`
}

// RallyMetadata contains rally & tour event metadata
type RallyMetadata struct {
	CertificateNumber string `json:"certificateNumber"`
	Route             string `json:"route"`
	CarNumber         string `json:"carNumber,omitempty"`
	CoDriver          string `json:"coDriver,omitempty"`
	DistanceDriven    *int   `json:"distanceDriven,omitempty"`
}

// VintageRacingMetadata contains vintage racing & track day event metadata
type VintageRacingMetadata struct {
	CertificateNumber string  `json:"certificateNumber"`
	TrackName         string  `json:"trackName"`
	RaceClass         string  `json:"raceClass"`
	RaceNumber        string  `json:"raceNumber,omitempty"`
	BestLapTime       *string `json:"bestLapTime,omitempty"`
}

// AuctionMetadata contains auction & sales event metadata
type AuctionMetadata struct {
	CertificateNumber string `json:"certificateNumber"`
	ParticipantName   string `json:"participantName,omitempty"`
	LotNumber         string `json:"lotNumber,omitempty"`
	AuctionHouse      string `json:"auctionHouse"`
	SaleStatus        string `json:"saleStatus,omitempty"`
}

// WorkshopMetadata contains restoration workshop & seminar event metadata
type WorkshopMetadata struct {
	CertificateNumber       string `json:"certificateNumber"`
	WorkshopTopic           string `json:"workshopTopic"`
	InstructorName          string `json:"instructorName,omitempty"`
	CompletionAcknowledgment bool  `json:"completionAcknowledgment"`
}

// ClubCompetitionMetadata contains club competition & awards event metadata
type ClubCompetitionMetadata struct {
	CertificateNumber string `json:"certificateNumber"`
	CompetitionCategory string `json:"competitionCategory"`
	AwardTitle        string `json:"awardTitle"`
	ClubChapter       string `json:"clubChapter,omitempty"`
}

// RoadTripMetadata contains road trip & heritage drive event metadata
type RoadTripMetadata struct {
	CertificateNumber string   `json:"certificateNumber"`
	RouteName         string   `json:"routeName"`
	TotalDistance     *int     `json:"totalDistance,omitempty"`
	CheckpointsCompleted []string `json:"checkpointsCompleted,omitempty"`
	DateRange         *string  `json:"dateRange,omitempty"`
}

// FestivalMetadata contains classic car festival event metadata
type FestivalMetadata struct {
	CertificateNumber string   `json:"certificateNumber"`
	FestivalTheme     string   `json:"festivalTheme"`
	ActivitiesParticipatedIn []string `json:"activitiesParticipatedIn,omitempty"`
}
