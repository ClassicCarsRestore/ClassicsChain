import type { Session } from '@ory/client';
import type { UserProfile } from './user';

export interface AuthContextType {
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isGlobalAdmin: () => boolean;
  hasAdminAccess: () => boolean;
  getEntityRole: (entityId: string) => 'admin' | 'member' | null;
  getUserEntities: () => UserProfile['entities'];
  hasMFA: () => boolean;
  aal: string | null;
  requireAAL2: (returnTo: string) => void;
}
