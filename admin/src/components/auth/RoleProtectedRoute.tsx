import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requireGlobalAdmin?: boolean;
  requireEntityAccess?: boolean;
  requireEntityAdmin?: boolean;
}

/**
 * RoleProtectedRoute - Protects routes based on user roles
 *
 * Usage:
 * - requireGlobalAdmin: Only allow global admins
 * - requireEntityAccess: Allow global admins OR any entity members (without requiring entityId param)
 * - requireEntityAdmin: Allow global admins OR entity admins (not regular members) when entityId is present
 */
export function RoleProtectedRoute({
  children,
  requireGlobalAdmin = false,
  requireEntityAccess = false,
  requireEntityAdmin = false,
}: RoleProtectedRouteProps) {
  const { isGlobalAdmin, getEntityRole, getUserEntities, isLoading } = useAuth();
  const { entityId } = useParams<{ entityId: string }>();

  // Wait for auth to load
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Check global admin access
  if (requireGlobalAdmin && !isGlobalAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Check entity access - allow if global admin or has any entity membership
  if (requireEntityAccess) {
    const userEntities = getUserEntities();
    const hasEntityAccess = isGlobalAdmin() || userEntities.length > 0;

    // If entityId is in route params, verify access to that specific entity
    if (entityId) {
      const role = getEntityRole(entityId);
      const hasSpecificEntityAccess = isGlobalAdmin() || role !== null;
      if (!hasSpecificEntityAccess) {
        return <Navigate to="/" replace />;
      }
    } else if (!hasEntityAccess) {
      return <Navigate to="/" replace />;
    }
  }

  // Check entity admin access (requires entityId from route params)
  if (requireEntityAdmin && entityId) {
    const role = getEntityRole(entityId);
    const hasAdminAccess = isGlobalAdmin() || role === 'admin';

    if (!hasAdminAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
