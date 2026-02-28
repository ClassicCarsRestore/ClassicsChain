export interface VerificationEvent {
  id: string;
  type: string;
  title: string;
  date: string;
  entityName?: string;
  isAnchored: boolean;
  blockchainTxId?: string;
  cid?: string;
}

export interface VehicleVerificationResponse {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  isAnchored: boolean;
  blockchainAssetId?: string;
  vehicleCid?: string;
  algorandNetwork: string;
  totalEvents: number;
  anchoredEvents: number;
  certifiedEvents: number;
  events: VerificationEvent[];
}
