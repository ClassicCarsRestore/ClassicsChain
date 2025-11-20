import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@ory/client';
import { kratos } from '@/lib/kratos';
import { api } from '@/lib/api';
import type { AuthContextType } from '@/types/auth';
import type { UserProfile } from '@/types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await kratos.toSession();
      setSession(data);

      // Build user profile from Kratos session and backend entities
      if (data && data.identity) {
        try {
          // Extract basic user info from Kratos identity
          const traits = (data.identity.traits || {}) as Record<string, any>;
          const metadata = (data.identity.metadata_public || {}) as Record<string, any>;

          const name = traits.name?.first && traits.name?.last
            ? `${traits.name.first} ${traits.name.last}`
            : traits.name?.first;

          // Fetch entity memberships and pending invitations from backend
          let entities: UserProfile['entities'] = [];
          let pendingInvitations: UserProfile['pendingInvitations'] = { count: 0, vehicles: [] };
          try {
            const meResponse = await api.get<UserProfile>('/v1/me');
            entities = meResponse.entities || [];
            pendingInvitations = meResponse.pendingInvitations || { count: 0, vehicles: [] };
          } catch (err) {
            console.error('Failed to fetch user profile:', err);
          }

          const profile: UserProfile = {
            id: data.identity.id,
            email: traits.email || '',
            name,
            isAdmin: metadata.isAdmin === true,
            entities,
            pendingInvitations,
          };

          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to build user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      setSession(null);
      setUserProfile(null);
      setError(err instanceof Error ? err : new Error('Failed to fetch session'));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { data } = await kratos.createBrowserLogoutFlow();
      window.location.href = data.logout_url;
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err instanceof Error ? err : new Error('Logout failed'));
    }
  };

  const isGlobalAdmin = () => {
    return userProfile?.isAdmin || false;
  };

  const hasAdminAccess = () => {
    return (userProfile?.isAdmin || false) || (userProfile?.entities.length || 0) > 0;
  };

  const getEntityRole = (entityId: string): 'admin' | 'member' | null => {
    const entity = userProfile?.entities.find((e) => e.entityId === entityId);
    return entity?.role || null;
  };

  const getUserEntities = () => {
    return userProfile?.entities || [];
  };

  const hasMFA = () => {
    return session?.authentication_methods?.some(
      method => method.method === 'totp' || method.method === 'lookup_secret'
    ) || false;
  };

  const requireAAL2 = (returnTo: string) => {
    const url = new URL('/login', window.location.origin);
    url.searchParams.set('aal', 'aal2');
    url.searchParams.set('return_to', returnTo);
    window.location.href = url.toString();
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const value: AuthContextType = {
    session,
    userProfile,
    isLoading,
    isAuthenticated: !!session,
    error,
    logout,
    refreshSession,
    isGlobalAdmin,
    hasAdminAccess,
    getEntityRole,
    getUserEntities,
    hasMFA,
    aal: session?.authenticator_assurance_level || null,
    requireAAL2,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
