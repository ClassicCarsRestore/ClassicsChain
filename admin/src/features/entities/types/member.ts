export interface EntityMember {
  userId: string;
  userName?: string;
  userEmail?: string;
  role: 'admin' | 'member';
}

export interface AddEntityMemberRequest {
  email: string;
  name?: string;
  role: 'admin' | 'member';
}

export interface UpdateEntityMemberRoleRequest {
  role: 'admin' | 'member';
}
