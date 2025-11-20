export interface VehicleFormData {
  licensePlate: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  engineNumber: string;
  transmissionNumber: string;
  bodyType: string;
  driveType: string;
  gearType: string;
  suspensionType: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  engineNumber: string;
  transmissionNumber: string;
  bodyType: string;
  driveType: string;
  gearType: string;
  suspensionType: string;
  ownerId: string | null;
  blockchainAddress: string | null;
  ipfsHash: string | null;
  createdAt: string;
}

// Event Type Union for type safety
export type EventType =
  | 'certification'
  | 'car_show'
  | 'classic_meet'
  | 'rally'
  | 'vintage_racing'
  | 'auction'
  | 'workshop'
  | 'club_competition'
  | 'road_trip'
  | 'festival'
  | 'race_participation'
  | 'show_participation'
  | 'maintenance'
  | 'ownership_transfer'
  | 'restoration'
  | 'modification';

// Base metadata all event types must have
export interface BaseEventMetadata {
  certificateNumber: string;
}

// Certification-specific metadata
export interface CertificationEventMetadata extends BaseEventMetadata {
  conditionAssessment: string;
  validityEndDate?: string;
  documentationReferences: string[];
}

// Car Show metadata
export interface CarShowMetadata extends BaseEventMetadata {
  category: string;
  award?: string;
  judgingScore?: number;
}

// Classic Meet metadata
export interface ClassicMeetMetadata extends BaseEventMetadata {
  clubName: string;
  theme?: string;
}

// Rally metadata
export interface RallyMetadata extends BaseEventMetadata {
  route: string;
  carNumber?: string;
  coDriver?: string;
  distanceDriven?: number;
}

// Vintage Racing metadata
export interface VintageRacingMetadata extends BaseEventMetadata {
  trackName: string;
  raceClass: string;
  raceNumber?: string;
  bestLapTime?: string;
}

// Auction metadata
export interface AuctionMetadata extends BaseEventMetadata {
  auctionHouse: string;
  participantName?: string;
  lotNumber?: string;
  saleStatus?: string;
}

// Workshop metadata
export interface WorkshopMetadata extends BaseEventMetadata {
  workshopTopic: string;
  instructorName?: string;
  completionAcknowledgment: boolean;
}

// Club Competition metadata
export interface ClubCompetitionMetadata extends BaseEventMetadata {
  competitionCategory: string;
  awardTitle: string;
  clubChapter?: string;
}

// Road Trip metadata
export interface RoadTripMetadata extends BaseEventMetadata {
  routeName: string;
  totalDistance?: number;
  checkpointsCompleted?: string[];
  dateRange?: string;
}

// Festival metadata
export interface FestivalMetadata extends BaseEventMetadata {
  festivalTheme: string;
  activitiesParticipatedIn?: string[];
}

// Union type for all metadata types
export type EventMetadata =
  | CertificationEventMetadata
  | CarShowMetadata
  | ClassicMeetMetadata
  | RallyMetadata
  | VintageRacingMetadata
  | AuctionMetadata
  | WorkshopMetadata
  | ClubCompetitionMetadata
  | RoadTripMetadata
  | FestivalMetadata;
