export interface OAuth2Client {
  clientId: string;
  clientSecret?: string; // Only present on creation
  entityId: string;
  entityName?: string;
  description?: string;
  scopes: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOAuth2ClientDto {
  description?: string;
  scopes: string[];
}

export const AVAILABLE_SCOPES = [
  'vehicles:read',
  'vehicles:write',
  'certifications:read',
  'certifications:write',
  'events:read',
  'events:write',
];

// Maps scope names to i18n keys for localization
export const SCOPE_I18N_KEYS: Record<string, string> = {
  'vehicles:read': 'scopes.vehiclesRead',
  'vehicles:write': 'scopes.vehiclesWrite',
  'certifications:read': 'scopes.certificationsRead',
  'certifications:write': 'scopes.certificationsWrite',
  'events:read': 'scopes.eventsRead',
  'events:write': 'scopes.eventsWrite',
};
