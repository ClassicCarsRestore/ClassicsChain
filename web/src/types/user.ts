export interface UserEntityMembership {
  entityId: string;
  entityName: string;
  entityType: 'certifier' | 'partner';
  role: 'admin' | 'member';
}

export interface InvitationVehicle {
  vehicleId: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
}

export interface PendingInvitations {
  count: number;
  vehicles: InvitationVehicle[];
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  entities: UserEntityMembership[];
  pendingInvitations: PendingInvitations;
}
