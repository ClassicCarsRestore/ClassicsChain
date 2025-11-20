export interface UserEntityMembership {
  entityId: string;
  entityName: string;
  entityType: 'certifier' | 'partner';
  role: 'admin' | 'member';
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  entities: UserEntityMembership[];
}
