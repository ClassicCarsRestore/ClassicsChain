export const EntityType = {
  Certifier: 'certifier',
  Partner: 'partner',
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export interface Address {
  street?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  contactEmail: string;
  website?: string;
  address?: Address;
  certifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityDto {
  name: string;
  type: EntityType;
  description?: string;
  contactEmail: string;
  website?: string;
  address?: Address;
}

export interface UpdateEntityDto {
  name?: string;
  description?: string;
  contactEmail?: string;
  website?: string;
  address?: Address;
}
